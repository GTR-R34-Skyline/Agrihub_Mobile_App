"""
Seed data script for AgriHub
Run with: python seed_data.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
from pathlib import Path
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Sample base64 placeholder images (1x1 pixel PNG)
SAMPLE_IMAGE = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

async def seed_users():
    """Create sample users"""
    print("Creating users...")
    
    users_data = [
        # Admin
        {
            "email": "admin@agrihub.com",
            "password_hash": pwd_context.hash("admin123"),
            "name": "Admin User",
            "phone": "+91 9876543210",
            "role": "admin",
            "address": "AgriHub HQ, Chennai",
            "created_at": datetime.utcnow()
        },
        # Farmers
        {
            "email": "farmer1@example.com",
            "password_hash": pwd_context.hash("farmer123"),
            "name": "Raj Kumar",
            "phone": "+91 9876543211",
            "role": "farmer",
            "address": "Village: Thanjavur, Tamil Nadu",
            "created_at": datetime.utcnow()
        },
        {
            "email": "farmer2@example.com",
            "password_hash": pwd_context.hash("farmer123"),
            "name": "Suresh Patel",
            "phone": "+91 9876543212",
            "role": "farmer",
            "address": "Village: Coimbatore, Tamil Nadu",
            "created_at": datetime.utcnow()
        },
        {
            "email": "farmer3@example.com",
            "password_hash": pwd_context.hash("farmer123"),
            "name": "Lakshmi Devi",
            "phone": "+91 9876543213",
            "role": "farmer",
            "address": "Village: Madurai, Tamil Nadu",
            "created_at": datetime.utcnow()
        },
        # Buyers
        {
            "email": "buyer1@example.com",
            "password_hash": pwd_context.hash("buyer123"),
            "name": "Arun Sharma",
            "phone": "+91 9876543214",
            "role": "buyer",
            "address": "123 MG Road, Chennai",
            "created_at": datetime.utcnow()
        },
        {
            "email": "buyer2@example.com",
            "password_hash": pwd_context.hash("buyer123"),
            "name": "Priya Singh",
            "phone": "+91 9876543215",
            "role": "buyer",
            "address": "456 Park Street, Bangalore",
            "created_at": datetime.utcnow()
        },
    ]
    
    # Clear existing users
    await db.users.delete_many({})
    result = await db.users.insert_many(users_data)
    print(f"Created {len(result.inserted_ids)} users")
    return result.inserted_ids

async def seed_products(user_ids):
    """Create sample products"""
    print("Creating products...")
    
    # Get farmer IDs
    farmers = await db.users.find({"role": "farmer"}).to_list(100)
    farmer_ids = [str(f["_id"]) for f in farmers]
    
    categories = ["Vegetables", "Fruits", "Grains", "Pulses", "Spices"]
    
    products_data = [
        # Farmer 1 products
        {
            "farmer_id": farmer_ids[0],
            "name": "Fresh Tomatoes",
            "category": "Vegetables",
            "price": 40.0,
            "quantity": 500,
            "description": "Farm-fresh red tomatoes, perfect for cooking. Rich in vitamins and minerals.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.5,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=10)
        },
        {
            "farmer_id": farmer_ids[0],
            "name": "Organic Potatoes",
            "category": "Vegetables",
            "price": 30.0,
            "quantity": 1000,
            "description": "Chemical-free organic potatoes, freshly harvested.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.8,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=8)
        },
        {
            "farmer_id": farmer_ids[0],
            "name": "Green Chillies",
            "category": "Vegetables",
            "price": 60.0,
            "quantity": 200,
            "description": "Fresh spicy green chillies for your daily cooking needs.",
            "images": [SAMPLE_IMAGE],
            "status": "pending",
            "avg_rating": 0,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=2)
        },
        # Farmer 2 products
        {
            "farmer_id": farmer_ids[1],
            "name": "Basmati Rice",
            "category": "Grains",
            "price": 80.0,
            "quantity": 2000,
            "description": "Premium quality basmati rice with long grains and aromatic fragrance.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.7,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=15)
        },
        {
            "farmer_id": farmer_ids[1],
            "name": "Wheat Flour",
            "category": "Grains",
            "price": 45.0,
            "quantity": 1500,
            "description": "Stone-ground wheat flour, perfect for making rotis and bread.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.3,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=12)
        },
        {
            "farmer_id": farmer_ids[1],
            "name": "Organic Turmeric",
            "category": "Spices",
            "price": 120.0,
            "quantity": 100,
            "description": "Premium organic turmeric powder with high curcumin content.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.9,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=20)
        },
        # Farmer 3 products
        {
            "farmer_id": farmer_ids[2],
            "name": "Fresh Mangoes",
            "category": "Fruits",
            "price": 100.0,
            "quantity": 500,
            "description": "Juicy Alphonso mangoes, the king of fruits. Sweet and delicious!",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 5.0,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=5)
        },
        {
            "farmer_id": farmer_ids[2],
            "name": "Bananas",
            "category": "Fruits",
            "price": 40.0,
            "quantity": 800,
            "description": "Fresh yellow bananas, rich in potassium and energy.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.4,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=7)
        },
        {
            "farmer_id": farmer_ids[2],
            "name": "Red Lentils (Masoor Dal)",
            "category": "Pulses",
            "price": 90.0,
            "quantity": 600,
            "description": "High-quality red lentils, protein-rich and easy to cook.",
            "images": [SAMPLE_IMAGE],
            "status": "approved",
            "avg_rating": 4.6,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=18)
        },
        {
            "farmer_id": farmer_ids[2],
            "name": "Coconuts",
            "category": "Fruits",
            "price": 35.0,
            "quantity": 300,
            "description": "Fresh coconuts with sweet water and tender meat.",
            "images": [SAMPLE_IMAGE],
            "status": "pending",
            "avg_rating": 0,
            "review_count": 0,
            "created_at": datetime.utcnow() - timedelta(days=1)
        },
    ]
    
    # Clear existing products
    await db.products.delete_many({})
    result = await db.products.insert_many(products_data)
    print(f"Created {len(result.inserted_ids)} products")
    return result.inserted_ids

async def seed_orders(user_ids, product_ids):
    """Create sample orders"""
    print("Creating orders...")
    
    # Get buyers and farmers
    buyers = await db.users.find({"role": "buyer"}).to_list(100)
    buyers_ids = [str(b["_id"]) for b in buyers]
    
    products = await db.products.find({"status": "approved"}).to_list(100)
    
    orders_data = []
    order_items_data = []
    
    # Create 5 sample orders
    for i in range(5):
        buyer_id = random.choice(buyers_ids)
        product = random.choice(products)
        farmer_id = product["farmer_id"]
        quantity = random.randint(1, 5)
        total_amount = product["price"] * quantity
        
        order_doc = {
            "buyer_id": buyer_id,
            "farmer_id": farmer_id,
            "total_amount": total_amount,
            "status": random.choice(["pending", "confirmed", "shipped", "delivered"]),
            "shipping_address": "Sample Address, Chennai",
            "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 30)),
            "updated_at": datetime.utcnow() - timedelta(days=random.randint(0, 5))
        }
        orders_data.append(order_doc)
    
    # Clear existing orders
    await db.orders.delete_many({})
    await db.order_items.delete_many({})
    
    if orders_data:
        result = await db.orders.insert_many(orders_data)
        order_ids = result.inserted_ids
        
        # Create order items
        for i, order_id in enumerate(order_ids):
            order = orders_data[i]
            # Find a product from the same farmer
            farmer_products = [p for p in products if p["farmer_id"] == order["farmer_id"]]
            if farmer_products:
                product = random.choice(farmer_products)
                quantity = random.randint(1, 5)
                
                order_item = {
                    "order_id": str(order_id),
                    "product_id": str(product["_id"]),
                    "quantity": quantity,
                    "price_at_purchase": product["price"],
                    "created_at": order["created_at"]
                }
                order_items_data.append(order_item)
        
        if order_items_data:
            await db.order_items.insert_many(order_items_data)
        
        print(f"Created {len(result.inserted_ids)} orders with {len(order_items_data)} items")
        return order_ids
    return []

async def seed_reviews(order_ids):
    """Create sample reviews"""
    print("Creating reviews...")
    
    # Get delivered orders
    delivered_orders = await db.orders.find({"status": "delivered"}).to_list(100)
    
    reviews_data = []
    
    for order in delivered_orders[:3]:  # Create reviews for first 3 delivered orders
        # Get order items
        order_items = await db.order_items.find({"order_id": str(order["_id"])}).to_list(100)
        
        for item in order_items:
            rating = random.randint(4, 5)
            review_texts = [
                "Excellent quality! Very fresh and delivered on time.",
                "Good product, will order again.",
                "Amazing quality! Highly recommended.",
                "Very satisfied with the purchase.",
                "Fresh and organic as promised!"
            ]
            
            review_doc = {
                "product_id": item["product_id"],
                "buyer_id": order["buyer_id"],
                "order_id": str(order["_id"]),
                "rating": rating,
                "text": random.choice(review_texts),
                "created_at": datetime.utcnow() - timedelta(days=random.randint(1, 10))
            }
            reviews_data.append(review_doc)
    
    # Clear existing reviews
    await db.reviews.delete_many({})
    
    if reviews_data:
        result = await db.reviews.insert_many(reviews_data)
        print(f"Created {len(result.inserted_ids)} reviews")
        
        # Update product ratings
        for review in reviews_data:
            all_reviews = await db.reviews.find({"product_id": review["product_id"]}).to_list(1000)
            if all_reviews:
                avg_rating = sum(r["rating"] for r in all_reviews) / len(all_reviews)
                await db.products.update_one(
                    {"_id": review["product_id"]},
                    {"$set": {"avg_rating": avg_rating, "review_count": len(all_reviews)}}
                )
        
        return result.inserted_ids
    return []

async def seed_notifications():
    """Create sample notifications"""
    print("Creating notifications...")
    
    users = await db.users.find().to_list(100)
    
    notifications_data = []
    
    for user in users:
        if user["role"] == "farmer":
            notifications_data.extend([
                {
                    "user_id": str(user["_id"]),
                    "type": "new_order",
                    "message": "New order received!",
                    "read": False,
                    "created_at": datetime.utcnow() - timedelta(hours=2)
                },
                {
                    "user_id": str(user["_id"]),
                    "type": "new_review",
                    "message": "You received a 5-star review!",
                    "read": True,
                    "created_at": datetime.utcnow() - timedelta(days=1)
                }
            ])
        elif user["role"] == "buyer":
            notifications_data.extend([
                {
                    "user_id": str(user["_id"]),
                    "type": "order_status_update",
                    "message": "Your order has been shipped",
                    "read": False,
                    "created_at": datetime.utcnow() - timedelta(hours=5)
                }
            ])
        elif user["role"] == "admin":
            notifications_data.extend([
                {
                    "user_id": str(user["_id"]),
                    "type": "new_product",
                    "message": "New product awaiting approval",
                    "read": False,
                    "created_at": datetime.utcnow() - timedelta(hours=1)
                }
            ])
    
    # Clear existing notifications
    await db.notifications.delete_many({})
    
    if notifications_data:
        result = await db.notifications.insert_many(notifications_data)
        print(f"Created {len(result.inserted_ids)} notifications")
        return result.inserted_ids
    return []

async def main():
    print("Starting database seeding...")
    print("=" * 50)
    
    # Clear all collections first
    await db.users.delete_many({})
    await db.products.delete_many({})
    await db.orders.delete_many({})
    await db.order_items.delete_many({})
    await db.reviews.delete_many({})
    await db.cart_items.delete_many({})
    await db.notifications.delete_many({})
    
    # Seed data
    user_ids = await seed_users()
    product_ids = await seed_products(user_ids)
    order_ids = await seed_orders(user_ids, product_ids)
    review_ids = await seed_reviews(order_ids)
    notification_ids = await seed_notifications()
    
    print("=" * 50)
    print("Database seeding completed successfully!")
    print("\nDemo Credentials:")
    print("-" * 50)
    print("Admin:")
    print("  Email: admin@agrihub.com")
    print("  Password: admin123")
    print("\nFarmers:")
    print("  Email: farmer1@example.com, Password: farmer123")
    print("  Email: farmer2@example.com, Password: farmer123")
    print("  Email: farmer3@example.com, Password: farmer123")
    print("\nBuyers:")
    print("  Email: buyer1@example.com, Password: buyer123")
    print("  Email: buyer2@example.com, Password: buyer123")
    print("=" * 50)
    
    client.close()

if __name__ == "__main__":
    asyncio.run(main())
