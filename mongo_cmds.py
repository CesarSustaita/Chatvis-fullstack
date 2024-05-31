from pymongo import MongoClient

client = MongoClient(
    "mongodb+srv://lj:lj12345@cluster0.jil1xg7.mongodb.net/?retryWrites=true&w=majority"
)
db = client["test"]
users_collection = db["users"]

try:
    # users_collection.update_many(
    #     {"estado": "24"},
    #     {"$set": {"estado_str": "San Luis Potosí"}}
    # )
    print("Documentos actualizados")
except Exception as e:
    print(f"Error: {e}")
    