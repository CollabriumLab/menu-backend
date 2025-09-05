import express from 'express';
import dotenv from 'dotenv';

const app = express();
dotenv.config();


app.get('/',(req ,res) =>{
    res.send('i am running now ')
})

const PORT = process.env.PORT || 8000;

app.listen(PORT,()=>{
    console.log(`server is running ${PORT}`);
    
})
