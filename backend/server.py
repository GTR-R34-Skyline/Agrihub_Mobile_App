from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId
import socketio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Security
security = HTTPBearer()

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=True,
    engineio_logger=True
)

# Create the main app
app = FastAPI()

# Create Socket.IO ASGI app
socket_app = socketio.ASGIApp(sio, app)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== PYDANTIC MODELS ====================

class UserRole:
    FARMER = "farmer"
    BUYER = "buyer"
    ADMIN = "admin"

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str
    role: str
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class ProductCreate(BaseModel):
    name: str
    category: str
    price: float
    quantity: int
    description: str
    images: List[str]  # base64 strings

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    description: Optional[str] = None
    images: Optional[List[str]] = None

class ProductApproval(BaseModel):
    status: str  # approved or rejected

class CartItemCreate(BaseModel):
    product_id: str
    quantity: int

class CartItemUpdate(BaseModel):
    quantity: int

class OrderCreate(BaseModel):
    shipping_address: str
    items: List[Dict[str, Any]]  # [{product_id, quantity, price}]

class OrderStatusUpdate(BaseModel):
    status: str  # pending, confirmed, shipped, delivered

class ReviewCreate(BaseModel):
    product_id: str
    order_id: str
    rating: int  # 1-5
    text: str

class NotificationCreate(BaseModel):
    user_id: str
    type: str
    message: str

# ==================== HELPER FUNCTIONS ====================

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def serialize_doc(doc):
    """Convert MongoDB document to JSON-serializable format"""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize_doc(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if key == "_id":
                result["id"] = str(value)
            elif isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, datetime):
                result[key] = value.isoformat()
            elif isinstance(value, dict):
                result[key] = serialize_doc(value)
            elif isinstance(value, list):
                result[key] = serialize_doc(value)
            else:
                result[key] = value
        return result
    return doc

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return serialize_doc(user)

def require_role(allowed_roles: List[str]):
    async def role_checker(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permission denied")
        return current_user
    return role_checker

# ==================== SOCKET.IO EVENTS ====================

@sio.event
async def connect(sid, environ):
    logging.info(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    logging.info(f"Client disconnected: {sid}")

@sio.event
async def join_user_room(sid, data):
    user_id = data.get('user_id')
    if user_id:
        await sio.enter_room(sid, f"user_{user_id}")
        logging.info(f"User {user_id} joined room")

async def send_notification_to_user(user_id: str, notification: dict):
    """Send real-time notification to a specific user"""
    await sio.emit('notification', notification, room=f"user_{user_id}")

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user_data: UserSignup):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if user_data.role not in [UserRole.FARMER, UserRole.BUYER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create user document
    user_doc = {
        "email": user_data.email,
        "password_hash": get_password_hash(user_data.password),
        "name": user_data.name,
        "phone": user_data.phone,
        "role": user_data.role,
        "address": user_data.address,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    # Create access token
    access_token = create_access_token(data={"sub": user_id})
    
    # Get user data
    user = await db.users.find_one({"_id": result.inserted_id})
    user_data = serialize_doc(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    user_id = str(user["_id"])
    access_token = create_access_token(data={"sub": user_id})
    
    user_data = serialize_doc(user)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data
    }

@api_router.get("/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

# ==================== PRODUCT ENDPOINTS ====================

@api_router.post("/products")
async def create_product(
    product: ProductCreate,
    current_user: dict = Depends(require_role([UserRole.FARMER]))
):
    product_doc = {
        "farmer_id": current_user["id"],
        "name": product.name,
        "category": product.category,
        "price": product.price,
        "quantity": product.quantity,
        "description": product.description,
        "images": product.images,
        "status": "pending",  # Needs admin approval
        "avg_rating": 0,
        "review_count": 0,
        "created_at": datetime.utcnow()
    }
    
    result = await db.products.insert_one(product_doc)
    created_product = await db.products.find_one({"_id": result.inserted_id})
    
    # Notify admins about new product
    admins = await db.users.find({"role": UserRole.ADMIN}).to_list(100)
    for admin in admins:
        notification_doc = {
            "user_id": str(admin["_id"]),
            "type": "new_product",
            "message": f"New product '{product.name}' awaiting approval",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification_doc)
        await send_notification_to_user(str(admin["_id"]), serialize_doc(notification_doc))
    
    return serialize_doc(created_product)

@api_router.get("/products")
async def get_products(
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    status: Optional[str] = "approved"
):
    query = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if min_price is not None or max_price is not None:
        query["price"] = {}
        if min_price is not None:
            query["price"]["$gte"] = min_price
        if max_price is not None:
            query["price"]["$lte"] = max_price
    
    products = await db.products.find(query).to_list(1000)
    
    # Get farmer info for each product
    result = []
    for product in products:
        product_data = serialize_doc(product)
        farmer = await db.users.find_one({"_id": ObjectId(product["farmer_id"])})
        if farmer:
            product_data["farmer"] = {
                "id": str(farmer["_id"]),
                "name": farmer["name"],
                "phone": farmer["phone"]
            }
        result.append(product_data)
    
    return result

@api_router.get("/products/{product_id}")
async def get_product(product_id: str):
    try:
        product = await db.products.find_one({"_id": ObjectId(product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        product_data = serialize_doc(product)
        
        # Get farmer info
        farmer = await db.users.find_one({"_id": ObjectId(product["farmer_id"])})
        if farmer:
            product_data["farmer"] = {
                "id": str(farmer["_id"]),
                "name": farmer["name"],
                "phone": farmer["phone"]
            }
        
        # Get reviews
        reviews = await db.reviews.find({"product_id": product_id}).to_list(100)
        reviews_data = []
        for review in reviews:
            review_data = serialize_doc(review)
            buyer = await db.users.find_one({"_id": ObjectId(review["buyer_id"])})
            if buyer:
                review_data["buyer_name"] = buyer["name"]
            reviews_data.append(review_data)
        
        product_data["reviews"] = reviews_data
        
        return product_data
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@api_router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_user: dict = Depends(require_role([UserRole.FARMER]))
):
    # Check if product exists and belongs to farmer
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["farmer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update only provided fields
    update_data = {k: v for k, v in product_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": update_data}
    )
    
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_doc(updated_product)

@api_router.delete("/products/{product_id}")
async def delete_product(
    product_id: str,
    current_user: dict = Depends(require_role([UserRole.FARMER]))
):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if product["farmer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.products.delete_one({"_id": ObjectId(product_id)})
    return {"message": "Product deleted successfully"}

@api_router.get("/farmer/products")
async def get_farmer_products(current_user: dict = Depends(require_role([UserRole.FARMER]))):
    products = await db.products.find({"farmer_id": current_user["id"]}).to_list(1000)
    return serialize_doc(products)

@api_router.put("/admin/products/{product_id}/approve")
async def approve_product(
    product_id: str,
    approval: ProductApproval,
    current_user: dict = Depends(require_role([UserRole.ADMIN]))
):
    product = await db.products.find_one({"_id": ObjectId(product_id)})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    await db.products.update_one(
        {"_id": ObjectId(product_id)},
        {"$set": {"status": approval.status, "updated_at": datetime.utcnow()}}
    )
    
    # Notify farmer
    notification_doc = {
        "user_id": product["farmer_id"],
        "type": "product_approval",
        "message": f"Your product '{product['name']}' has been {approval.status}",
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification_doc)
    await send_notification_to_user(product["farmer_id"], serialize_doc(notification_doc))
    
    updated_product = await db.products.find_one({"_id": ObjectId(product_id)})
    return serialize_doc(updated_product)

# ==================== CART ENDPOINTS ====================

@api_router.post("/cart")
async def add_to_cart(
    item: CartItemCreate,
    current_user: dict = Depends(require_role([UserRole.BUYER]))
):
    # Check if product exists
    product = await db.products.find_one({"_id": ObjectId(item.product_id)})
    if not product or product["status"] != "approved":
        raise HTTPException(status_code=404, detail="Product not available")
    
    # Check if item already in cart
    existing_item = await db.cart_items.find_one({
        "buyer_id": current_user["id"],
        "product_id": item.product_id
    })
    
    if existing_item:
        # Update quantity
        new_quantity = existing_item["quantity"] + item.quantity
        await db.cart_items.update_one(
            {"_id": existing_item["_id"]},
            {"$set": {"quantity": new_quantity, "updated_at": datetime.utcnow()}}
        )
        cart_item = await db.cart_items.find_one({"_id": existing_item["_id"]})
    else:
        # Add new item
        cart_doc = {
            "buyer_id": current_user["id"],
            "product_id": item.product_id,
            "quantity": item.quantity,
            "created_at": datetime.utcnow()
        }
        result = await db.cart_items.insert_one(cart_doc)
        cart_item = await db.cart_items.find_one({"_id": result.inserted_id})
    
    return serialize_doc(cart_item)

@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(require_role([UserRole.BUYER]))):
    cart_items = await db.cart_items.find({"buyer_id": current_user["id"]}).to_list(1000)
    
    result = []
    total = 0
    for item in cart_items:
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            item_data = serialize_doc(item)
            item_data["product"] = serialize_doc(product)
            item_data["subtotal"] = product["price"] * item["quantity"]
            total += item_data["subtotal"]
            result.append(item_data)
    
    return {"items": result, "total": total}

@api_router.put("/cart/{cart_item_id}")
async def update_cart_item(
    cart_item_id: str,
    update: CartItemUpdate,
    current_user: dict = Depends(require_role([UserRole.BUYER]))
):
    cart_item = await db.cart_items.find_one({"_id": ObjectId(cart_item_id)})
    if not cart_item or cart_item["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    await db.cart_items.update_one(
        {"_id": ObjectId(cart_item_id)},
        {"$set": {"quantity": update.quantity, "updated_at": datetime.utcnow()}}
    )
    
    updated_item = await db.cart_items.find_one({"_id": ObjectId(cart_item_id)})
    return serialize_doc(updated_item)

@api_router.delete("/cart/{cart_item_id}")
async def remove_from_cart(
    cart_item_id: str,
    current_user: dict = Depends(require_role([UserRole.BUYER]))
):
    cart_item = await db.cart_items.find_one({"_id": ObjectId(cart_item_id)})
    if not cart_item or cart_item["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    await db.cart_items.delete_one({"_id": ObjectId(cart_item_id)})
    return {"message": "Item removed from cart"}

@api_router.delete("/cart")
async def clear_cart(current_user: dict = Depends(require_role([UserRole.BUYER]))):
    await db.cart_items.delete_many({"buyer_id": current_user["id"]})
    return {"message": "Cart cleared"}

# ==================== ORDER ENDPOINTS ====================

@api_router.post("/orders")
async def create_order(
    order_data: OrderCreate,
    current_user: dict = Depends(require_role([UserRole.BUYER]))
):
    if not order_data.items:
        raise HTTPException(status_code=400, detail="No items in order")
    
    # Calculate total and validate items
    total_amount = 0
    farmer_orders = {}  # Group by farmer
    
    for item in order_data.items:
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if not product or product["status"] != "approved":
            raise HTTPException(status_code=400, detail=f"Product not available")
        
        if product["quantity"] < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product['name']}")
        
        farmer_id = product["farmer_id"]
        if farmer_id not in farmer_orders:
            farmer_orders[farmer_id] = []
        
        farmer_orders[farmer_id].append({
            "product": product,
            "quantity": item["quantity"],
            "price": product["price"]
        })
        
        total_amount += product["price"] * item["quantity"]
    
    # Create separate orders for each farmer
    created_orders = []
    
    for farmer_id, items in farmer_orders.items():
        farmer_total = sum(item["price"] * item["quantity"] for item in items)
        
        order_doc = {
            "buyer_id": current_user["id"],
            "farmer_id": farmer_id,
            "total_amount": farmer_total,
            "status": "pending",
            "shipping_address": order_data.shipping_address,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        order_result = await db.orders.insert_one(order_doc)
        order_id = str(order_result.inserted_id)
        
        # Create order items
        for item in items:
            order_item_doc = {
                "order_id": order_id,
                "product_id": str(item["product"]["_id"]),
                "quantity": item["quantity"],
                "price_at_purchase": item["price"],
                "created_at": datetime.utcnow()
            }
            await db.order_items.insert_one(order_item_doc)
            
            # Update product quantity
            await db.products.update_one(
                {"_id": item["product"]["_id"]},
                {"$inc": {"quantity": -item["quantity"]}}
            )
        
        # Clear cart for buyer
        await db.cart_items.delete_many({"buyer_id": current_user["id"]})
        
        # Notify farmer
        notification_doc = {
            "user_id": farmer_id,
            "type": "new_order",
            "message": f"New order received from {current_user['name']}",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification_doc)
        await send_notification_to_user(farmer_id, serialize_doc(notification_doc))
        
        created_order = await db.orders.find_one({"_id": order_result.inserted_id})
        created_orders.append(serialize_doc(created_order))
    
    return {"orders": created_orders, "message": "Orders placed successfully"}

@api_router.get("/orders")
async def get_orders(current_user: dict = Depends(get_current_user)):
    if current_user["role"] == UserRole.BUYER:
        query = {"buyer_id": current_user["id"]}
    elif current_user["role"] == UserRole.FARMER:
        query = {"farmer_id": current_user["id"]}
    elif current_user["role"] == UserRole.ADMIN:
        query = {}
    else:
        raise HTTPException(status_code=403, detail="Permission denied")
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(1000)
    
    result = []
    for order in orders:
        order_data = serialize_doc(order)
        
        # Get order items with product details
        order_items = await db.order_items.find({"order_id": order_data["id"]}).to_list(100)
        items_data = []
        for item in order_items:
            item_data = serialize_doc(item)
            product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
            if product:
                item_data["product"] = serialize_doc(product)
            items_data.append(item_data)
        
        order_data["items"] = items_data
        
        # Get buyer and farmer info
        buyer = await db.users.find_one({"_id": ObjectId(order["buyer_id"])})
        farmer = await db.users.find_one({"_id": ObjectId(order["farmer_id"])})
        
        if buyer:
            order_data["buyer"] = {"id": str(buyer["_id"]), "name": buyer["name"], "phone": buyer["phone"]}
        if farmer:
            order_data["farmer"] = {"id": str(farmer["_id"]), "name": farmer["name"], "phone": farmer["phone"]}
        
        result.append(order_data)
    
    return result

@api_router.get("/orders/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Check permission
    if current_user["role"] not in [UserRole.ADMIN]:
        if order["buyer_id"] != current_user["id"] and order["farmer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="Permission denied")
    
    order_data = serialize_doc(order)
    
    # Get order items
    order_items = await db.order_items.find({"order_id": order_id}).to_list(100)
    items_data = []
    for item in order_items:
        item_data = serialize_doc(item)
        product = await db.products.find_one({"_id": ObjectId(item["product_id"])})
        if product:
            item_data["product"] = serialize_doc(product)
        items_data.append(item_data)
    
    order_data["items"] = items_data
    
    return order_data

@api_router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    status_update: OrderStatusUpdate,
    current_user: dict = Depends(require_role([UserRole.FARMER]))
):
    order = await db.orders.find_one({"_id": ObjectId(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["farmer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    valid_statuses = ["pending", "confirmed", "shipped", "delivered"]
    if status_update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    await db.orders.update_one(
        {"_id": ObjectId(order_id)},
        {"$set": {"status": status_update.status, "updated_at": datetime.utcnow()}}
    )
    
    # Notify buyer
    notification_doc = {
        "user_id": order["buyer_id"],
        "type": "order_status_update",
        "message": f"Your order has been {status_update.status}",
        "read": False,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(notification_doc)
    await send_notification_to_user(order["buyer_id"], serialize_doc(notification_doc))
    
    updated_order = await db.orders.find_one({"_id": ObjectId(order_id)})
    return serialize_doc(updated_order)

# ==================== REVIEW ENDPOINTS ====================

@api_router.post("/reviews")
async def create_review(
    review: ReviewCreate,
    current_user: dict = Depends(require_role([UserRole.BUYER]))
):
    # Check if order exists and belongs to buyer
    order = await db.orders.find_one({"_id": ObjectId(review.order_id)})
    if not order or order["buyer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Invalid order")
    
    # Check if order is delivered
    if order["status"] != "delivered":
        raise HTTPException(status_code=400, detail="Can only review delivered orders")
    
    # Check if product is in the order
    order_item = await db.order_items.find_one({
        "order_id": review.order_id,
        "product_id": review.product_id
    })
    if not order_item:
        raise HTTPException(status_code=400, detail="Product not in order")
    
    # Check if already reviewed
    existing_review = await db.reviews.find_one({
        "buyer_id": current_user["id"],
        "product_id": review.product_id,
        "order_id": review.order_id
    })
    if existing_review:
        raise HTTPException(status_code=400, detail="Already reviewed")
    
    # Validate rating
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Create review
    review_doc = {
        "product_id": review.product_id,
        "buyer_id": current_user["id"],
        "order_id": review.order_id,
        "rating": review.rating,
        "text": review.text,
        "created_at": datetime.utcnow()
    }
    
    result = await db.reviews.insert_one(review_doc)
    
    # Update product average rating
    all_reviews = await db.reviews.find({"product_id": review.product_id}).to_list(1000)
    avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
    
    await db.products.update_one(
        {"_id": ObjectId(review.product_id)},
        {"$set": {"avg_rating": avg_rating, "review_count": len(all_reviews)}}
    )
    
    # Notify farmer
    product = await db.products.find_one({"_id": ObjectId(review.product_id)})
    if product:
        notification_doc = {
            "user_id": product["farmer_id"],
            "type": "new_review",
            "message": f"New {review.rating}-star review for '{product['name']}'",
            "read": False,
            "created_at": datetime.utcnow()
        }
        await db.notifications.insert_one(notification_doc)
        await send_notification_to_user(product["farmer_id"], serialize_doc(notification_doc))
    
    created_review = await db.reviews.find_one({"_id": result.inserted_id})
    return serialize_doc(created_review)

@api_router.get("/reviews/{product_id}")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}).sort("created_at", -1).to_list(1000)
    
    result = []
    for review in reviews:
        review_data = serialize_doc(review)
        buyer = await db.users.find_one({"_id": ObjectId(review["buyer_id"])})
        if buyer:
            review_data["buyer_name"] = buyer["name"]
        result.append(review_data)
    
    return result

# ==================== NOTIFICATION ENDPOINTS ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]}
    ).sort("created_at", -1).to_list(100)
    
    return serialize_doc(notifications)

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    notification = await db.notifications.find_one({"_id": ObjectId(notification_id)})
    if not notification or notification["user_id"] != current_user["id"]:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    await db.notifications.update_one(
        {"_id": ObjectId(notification_id)},
        {"$set": {"read": True}}
    )
    
    return {"message": "Notification marked as read"}

# ==================== ADMIN ENDPOINTS ====================

@api_router.get("/admin/users")
async def get_all_users(current_user: dict = Depends(require_role([UserRole.ADMIN]))):
    users = await db.users.find().to_list(1000)
    return serialize_doc(users)

@api_router.get("/admin/analytics")
async def get_analytics(current_user: dict = Depends(require_role([UserRole.ADMIN]))):
    total_users = await db.users.count_documents({})
    total_farmers = await db.users.count_documents({"role": UserRole.FARMER})
    total_buyers = await db.users.count_documents({"role": UserRole.BUYER})
    total_products = await db.products.count_documents({})
    approved_products = await db.products.count_documents({"status": "approved"})
    pending_products = await db.products.count_documents({"status": "pending"})
    total_orders = await db.orders.count_documents({})
    
    # Calculate total revenue
    orders = await db.orders.find().to_list(10000)
    total_revenue = sum(order.get("total_amount", 0) for order in orders)
    
    return {
        "total_users": total_users,
        "total_farmers": total_farmers,
        "total_buyers": total_buyers,
        "total_products": total_products,
        "approved_products": approved_products,
        "pending_products": pending_products,
        "total_orders": total_orders,
        "total_revenue": total_revenue
    }

@api_router.get("/admin/pending-products")
async def get_pending_products(current_user: dict = Depends(require_role([UserRole.ADMIN]))):
    products = await db.products.find({"status": "pending"}).to_list(1000)
    
    result = []
    for product in products:
        product_data = serialize_doc(product)
        farmer = await db.users.find_one({"_id": ObjectId(product["farmer_id"])})
        if farmer:
            product_data["farmer"] = {
                "id": str(farmer["_id"]),
                "name": farmer["name"],
                "phone": farmer["phone"]
            }
        result.append(product_data)
    
    return result

# ==================== MOCK PAYMENT ====================

@api_router.post("/payment/process")
async def process_payment(current_user: dict = Depends(require_role([UserRole.BUYER]))):
    import random
    
    # 90% success, 10% failure
    success = random.random() < 0.9
    
    if success:
        return {
            "success": True,
            "transaction_id": f"TXN{random.randint(100000, 999999)}",
            "message": "Payment successful"
        }
    else:
        return {
            "success": False,
            "message": "Payment failed. Please try again."
        }

# ==================== BASIC ENDPOINTS ====================

@api_router.get("/")
async def root():
    return {"message": "AgriHub API - Agriculture Marketplace"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.products.create_index("farmer_id")
    await db.products.create_index("category")
    await db.products.create_index("status")
    await db.cart_items.create_index([("buyer_id", 1), ("product_id", 1)])
    await db.orders.create_index("buyer_id")
    await db.orders.create_index("farmer_id")
    await db.order_items.create_index("order_id")
    await db.reviews.create_index("product_id")
    await db.notifications.create_index("user_id")
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
