from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============= Models =============

# Auth Models
class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class User(BaseModel):
    username: str
    role: str = "admin"

# Service Models
class ServiceCreate(BaseModel):
    name: str
    description: str
    price: float
    duration: int  # in minutes
    category: Optional[str] = "General"
    image_base64: Optional[str] = None
    enabled: bool = True

class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    duration: Optional[int] = None
    category: Optional[str] = None
    image_base64: Optional[str] = None
    enabled: Optional[bool] = None

class ServiceResponse(BaseModel):
    id: str
    name: str
    description: str
    price: float
    duration: int
    category: str
    image_base64: Optional[str] = None
    enabled: bool
    created_at: datetime

# Offer Models
class OfferCreate(BaseModel):
    title: str
    description: str
    type: str  # "percentage", "flat", "banner", "package"
    value: Optional[float] = None  # discount value
    image_base64: Optional[str] = None
    active: bool = True
    valid_until: Optional[datetime] = None

class OfferUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = None
    image_base64: Optional[str] = None
    active: Optional[bool] = None
    valid_until: Optional[datetime] = None

class OfferResponse(BaseModel):
    id: str
    title: str
    description: str
    type: str
    value: Optional[float] = None
    image_base64: Optional[str] = None
    active: bool
    valid_until: Optional[datetime] = None
    created_at: datetime

# Appointment Models
class AppointmentCreate(BaseModel):
    customer_name: str
    phone: str
    email: str
    service_id: str
    date: str  # YYYY-MM-DD
    time: str  # HH:MM
    notes: Optional[str] = None

class AppointmentUpdate(BaseModel):
    status: str  # "pending", "confirmed", "completed", "cancelled"

class AppointmentResponse(BaseModel):
    id: str
    customer_name: str
    phone: str
    email: str
    service_id: str
    service_name: Optional[str] = None
    date: str
    time: str
    status: str
    notes: Optional[str] = None
    created_at: datetime

# Gallery Models
class GalleryCreate(BaseModel):
    image_base64: str
    description: Optional[str] = None

class GalleryResponse(BaseModel):
    id: str
    image_base64: str
    description: Optional[str] = None
    created_at: datetime

# Contact Models
class ContactCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    message: str

class ContactResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    message: str
    created_at: datetime

# ============= Helper Functions =============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return {"username": username}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============= Startup & Initialization =============

@app.on_event("startup")
async def startup_event():
    # Create default admin user if not exists
    admin_exists = await db.users.find_one({"username": "admin"})
    if not admin_exists:
        hashed_password = get_password_hash("admin123")
        await db.users.insert_one({
            "username": "admin",
            "password": hashed_password,
            "role": "admin",
            "created_at": datetime.utcnow()
        })
        logger.info("Default admin user created (username: admin, password: admin123)")

# ============= Auth Routes =============

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    user = await db.users.find_one({"username": login_data.username})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token = create_access_token(data={"sub": user["username"]})
    return TokenResponse(access_token=access_token)

@api_router.get("/auth/verify")
async def verify_token(current_user: dict = Depends(get_current_user)):
    return {"valid": True, "username": current_user["username"]}

# ============= Service Routes =============

@api_router.get("/services", response_model=List[ServiceResponse])
async def get_services(enabled_only: bool = False):
    query = {"enabled": True} if enabled_only else {}
    services = await db.services.find(query).to_list(1000)
    return [
        ServiceResponse(
            id=str(service["_id"]),
            name=service["name"],
            description=service["description"],
            price=service["price"],
            duration=service["duration"],
            category=service.get("category", "General"),
            image_base64=service.get("image_base64"),
            enabled=service["enabled"],
            created_at=service["created_at"]
        )
        for service in services
    ]

@api_router.post("/services", response_model=ServiceResponse)
async def create_service(service: ServiceCreate, current_user: dict = Depends(get_current_user)):
    service_dict = service.dict()
    service_dict["created_at"] = datetime.utcnow()
    result = await db.services.insert_one(service_dict)
    service_dict["id"] = str(result.inserted_id)
    return ServiceResponse(**service_dict)

@api_router.put("/services/{service_id}", response_model=ServiceResponse)
async def update_service(service_id: str, service_update: ServiceUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in service_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    
    updated_service = await db.services.find_one({"_id": ObjectId(service_id)})
    return ServiceResponse(
        id=str(updated_service["_id"]),
        name=updated_service["name"],
        description=updated_service["description"],
        price=updated_service["price"],
        duration=updated_service["duration"],
        category=updated_service.get("category", "General"),
        image_base64=updated_service.get("image_base64"),
        enabled=updated_service["enabled"],
        created_at=updated_service["created_at"]
    )

@api_router.delete("/services/{service_id}")
async def delete_service(service_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"_id": ObjectId(service_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"message": "Service deleted successfully"}

@api_router.put("/services/{service_id}/toggle")
async def toggle_service(service_id: str, current_user: dict = Depends(get_current_user)):
    service = await db.services.find_one({"_id": ObjectId(service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    new_status = not service["enabled"]
    await db.services.update_one(
        {"_id": ObjectId(service_id)},
        {"$set": {"enabled": new_status}}
    )
    return {"message": f"Service {'enabled' if new_status else 'disabled'} successfully", "enabled": new_status}

# ============= Offer Routes =============

@api_router.get("/offers", response_model=List[OfferResponse])
async def get_offers(active_only: bool = False):
    query = {"active": True} if active_only else {}
    offers = await db.offers.find(query).to_list(1000)
    return [
        OfferResponse(
            id=str(offer["_id"]),
            title=offer["title"],
            description=offer["description"],
            type=offer["type"],
            value=offer.get("value"),
            image_base64=offer.get("image_base64"),
            active=offer["active"],
            valid_until=offer.get("valid_until"),
            created_at=offer["created_at"]
        )
        for offer in offers
    ]

@api_router.post("/offers", response_model=OfferResponse)
async def create_offer(offer: OfferCreate, current_user: dict = Depends(get_current_user)):
    offer_dict = offer.dict()
    offer_dict["created_at"] = datetime.utcnow()
    result = await db.offers.insert_one(offer_dict)
    offer_dict["id"] = str(result.inserted_id)
    return OfferResponse(**offer_dict)

@api_router.put("/offers/{offer_id}", response_model=OfferResponse)
async def update_offer(offer_id: str, offer_update: OfferUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in offer_update.dict().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    
    result = await db.offers.update_one(
        {"_id": ObjectId(offer_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    
    updated_offer = await db.offers.find_one({"_id": ObjectId(offer_id)})
    return OfferResponse(
        id=str(updated_offer["_id"]),
        title=updated_offer["title"],
        description=updated_offer["description"],
        type=updated_offer["type"],
        value=updated_offer.get("value"),
        image_base64=updated_offer.get("image_base64"),
        active=updated_offer["active"],
        valid_until=updated_offer.get("valid_until"),
        created_at=updated_offer["created_at"]
    )

@api_router.delete("/offers/{offer_id}")
async def delete_offer(offer_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.offers.delete_one({"_id": ObjectId(offer_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    return {"message": "Offer deleted successfully"}

# ============= Appointment Routes =============

@api_router.get("/appointments", response_model=List[AppointmentResponse])
async def get_appointments(current_user: dict = Depends(get_current_user)):
    appointments = await db.appointments.find().to_list(1000)
    response = []
    for appointment in appointments:
        # Get service name
        service = await db.services.find_one({"_id": ObjectId(appointment["service_id"])})
        service_name = service["name"] if service else "Unknown Service"
        
        response.append(AppointmentResponse(
            id=str(appointment["_id"]),
            customer_name=appointment["customer_name"],
            phone=appointment["phone"],
            email=appointment["email"],
            service_id=appointment["service_id"],
            service_name=service_name,
            date=appointment["date"],
            time=appointment["time"],
            status=appointment["status"],
            notes=appointment.get("notes"),
            created_at=appointment["created_at"]
        ))
    return response

@api_router.post("/appointments", response_model=AppointmentResponse)
async def create_appointment(appointment: AppointmentCreate):
    # Verify service exists
    service = await db.services.find_one({"_id": ObjectId(appointment.service_id)})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    appointment_dict = appointment.dict()
    appointment_dict["status"] = "pending"
    appointment_dict["created_at"] = datetime.utcnow()
    result = await db.appointments.insert_one(appointment_dict)
    
    return AppointmentResponse(
        id=str(result.inserted_id),
        customer_name=appointment.customer_name,
        phone=appointment.phone,
        email=appointment.email,
        service_id=appointment.service_id,
        service_name=service["name"],
        date=appointment.date,
        time=appointment.time,
        status="pending",
        notes=appointment.notes,
        created_at=appointment_dict["created_at"]
    )

@api_router.put("/appointments/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(appointment_id: str, appointment_update: AppointmentUpdate, current_user: dict = Depends(get_current_user)):
    result = await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": {"status": appointment_update.status}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    updated_appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    service = await db.services.find_one({"_id": ObjectId(updated_appointment["service_id"])})
    
    return AppointmentResponse(
        id=str(updated_appointment["_id"]),
        customer_name=updated_appointment["customer_name"],
        phone=updated_appointment["phone"],
        email=updated_appointment["email"],
        service_id=updated_appointment["service_id"],
        service_name=service["name"] if service else "Unknown Service",
        date=updated_appointment["date"],
        time=updated_appointment["time"],
        status=updated_appointment["status"],
        notes=updated_appointment.get("notes"),
        created_at=updated_appointment["created_at"]
    )

# ============= Gallery Routes =============

@api_router.get("/gallery", response_model=List[GalleryResponse])
async def get_gallery():
    gallery_items = await db.gallery.find().to_list(1000)
    return [
        GalleryResponse(
            id=str(item["_id"]),
            image_base64=item["image_base64"],
            description=item.get("description"),
            created_at=item["created_at"]
        )
        for item in gallery_items
    ]

@api_router.post("/gallery", response_model=GalleryResponse)
async def create_gallery_item(gallery: GalleryCreate, current_user: dict = Depends(get_current_user)):
    gallery_dict = gallery.dict()
    gallery_dict["created_at"] = datetime.utcnow()
    result = await db.gallery.insert_one(gallery_dict)
    gallery_dict["id"] = str(result.inserted_id)
    return GalleryResponse(**gallery_dict)

@api_router.delete("/gallery/{gallery_id}")
async def delete_gallery_item(gallery_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.gallery.delete_one({"_id": ObjectId(gallery_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    return {"message": "Gallery item deleted successfully"}

# ============= Contact Routes =============

@api_router.post("/contact", response_model=ContactResponse)
async def submit_contact(contact: ContactCreate):
    contact_dict = contact.dict()
    contact_dict["created_at"] = datetime.utcnow()
    result = await db.contacts.insert_one(contact_dict)
    contact_dict["id"] = str(result.inserted_id)
    return ContactResponse(**contact_dict)

@api_router.get("/contact", response_model=List[ContactResponse])
async def get_contacts(current_user: dict = Depends(get_current_user)):
    contacts = await db.contacts.find().to_list(1000)
    return [
        ContactResponse(
            id=str(contact["_id"]),
            name=contact["name"],
            email=contact["email"],
            phone=contact.get("phone"),
            message=contact["message"],
            created_at=contact["created_at"]
        )
        for contact in contacts
    ]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
