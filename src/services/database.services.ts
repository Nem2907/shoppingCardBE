
import { Collection, Db, MongoClient} from 'mongodb';
import dotenv from 'dotenv'
import User from '~/models/schemas/User.schema';
import RefreshToken from '~/models/schemas/RefreshToken.schema';

dotenv.config() // liên kết env (ko để lộ đường dẫn)

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@shopingcardk19s3cluster.lmlwz.mongodb.net/?retryWrites=true&w=majority&appName=shopingCardK19S3Cluster`
// bản chất database là một cục server
// ==>font-end là client (ám chỉ là người dùng)
class DatabaseServices{
    // const client = new MongoClient(uri);
    // biến thành một propterties 
    // 
    private client: MongoClient
    private db : Db
    constructor(){
        this.client = new MongoClient(uri);
        this.db = this.client.db(process.env.DB_NAME)
    }
    async connet(){
    try {
        await this.db.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } 
    catch(error){
        console.log(error)
        throw error
        }
    }
    //accessor property
    get users(): Collection<User>{
        return this.db.collection(process.env.DB_USERS_COLLECTION as string)
    }
    // 
    get refresh_tokens():Collection<RefreshToken>{
        return this.db.collection(process.env.DB_REFRESH_TOKENS_COLLECTION as string)
    }
}
// tạo bản thể
const databaseServices = new DatabaseServices();
export default databaseServices


