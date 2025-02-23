import { MongoClient, ObjectId } from 'mongodb'
const dbHost = "localhost:27017"
const dbUser = "yousra"
const dbPassword = "Noussa1"
const dbName = "testi"
const dataCollection = "data"
const usersCollection = "users"
const destConnString = `mongodb://${dbUser}:${dbPassword}@${dbHost}?authSource=${dbName}`
const dbServer = new MongoClient(destConnString)

let logonUsers = new Map();

// Method for connecting to the database
const openDbConn = async () => {
    try {
        await dbServer.connect();
        return dbServer.db(dbName)
    } catch (error) {
        console.error("Failed to conencto to the database", error)
        throw error;
    }
}

// Method for using a certain collection
const connDbCollection = async (collection) => {
    return db.collection(collection)
}

const sendQuery = async (query, toArray = false) => {
    try {
        const result = await query
        if(toArray)
            return await result.toArray()
        else 
            console.log("should do something")
    } catch (err) {
        console.error("Query execution failed", err)
        throw err
    }
}

//const findOneUser = async (username) => 
// sendQuery(`SELECT * FROM users WHERE username = ?`, true, username);
const findOneUser = async (username) => {
    console.log(username)
    const usersCol = await connDbCollection (usersCollection)
    return sendQuery(usersCol.find( //find -> aggregate()
        {username}).project({
            username: "$username",
            password: "$password",
            _id: 0
        }), true)
}

const insertUser = async (userData) => {
    const usersCol = await connDbCollection(usersCollection)
    return sendQuery(usersCol.insertOne(userData))
}

const getAllUsers = async () => {
    const usersCol = await connDbCollection(usersCollection)
    return sendQuery(usersCol.find({}), true)
}

const deleteUser = async (id) => {
    const usersCol = await connDbCollection(usersCollection)
    return sendQuery(usersCol.deleteOne
        ({ 
            _id: new ObjectId(id) 
        })
    )
}

const updateUser = async (id, updatedData) => {
    const usersCol = await connDbCollection(usersCollection)
    return sendQuery(usersCol.updateOne({ _id: new ObjectId(id) }, { $set: updatedData }));
}

const getUserRecords = async () => {
    try {
        const usersCol = await connDbCollection(usersCollection);
        return sendQuery(
            usersCol.aggregate([
                {
                    $lookup: {
                        from: dataCollection,  
                        localField: "username",  
                        foreignField: "userid",  
                        as: "user_records"
                    }
                },
                {
                    $group: {
                        _id: "$username",  
                        recordsCount: { $sum: { $size: "$user_records" } }  
                    }
                },
                {
                    $project: {
                        _id: 0,
                        username: "$_id",
                        recordsCount: 1
                    }
                }
            ]),
            true
        );
    } catch (error) {
        console.error("Error executing user records count query:", error);
        throw error;
    }
};


// Connect to database when the application starts
const db = await openDbConn()

const closeDbConnection = async () => {
    try {
        await dbServer.close()
        console.log("Database conenction closed")
    } catch (error) {
        console.error("Failed to close the database connection", error)
    }
}

process.on("SIGINT", closeDbConnection)
process.on("SIGNTERM", closeDbConnection)

export {
    findOneUser,
    logonUsers,
    insertUser,
    getAllUsers,
    deleteUser,
    updateUser,
    getUserRecords
}