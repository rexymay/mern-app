const mongoose = require('mongoose');
const config = require('config');
const db_str = config.get('mongoURI');
const connectDB = async () => {
    try{
        mongoose.connect(db_str, 
            {
                useNewUrlParser: true,
                useCreateIndex: true,
                useFindAndModify: false
            }
        );   
        console.log('MongoDB connected...');
    }
    catch(err){
        console.log(err.message);
        process.exit(1);
    }
}

module.exports = connectDB;