const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));

const data = fs.readFileSync('./database.json');
const conf = JSON.parse(data);
const mysql = require('mysql');

const multer = require('multer');
//const upload = multer({dest: './upload'})
const selectAll = "SELECT * FROM user";

const connection = mysql.createConnection({
  host: conf.host,
  user: conf.user,
  password: conf.password,
  port: conf.port,
  database: conf.database
});

connection.connect(err => {
  if(err){
    console.log(err);
  }else{
    console.log('MySQL 서버에 연결되었습니다.');
  }
});


app.use(cors());

//서버 연결 잘 되었는지 확인하는 용도
app.get('/',(req,res,err) => {
  res.send(`hello from the products server`);
});

//user 게시판 (test용도) => 마지막에 파기해도 괜찮을 것 같다.
app.get('/api/test',(req,res,err) => {
  //console.log(err);
  connection.query(selectAll,
    (err,rows,fields) => {
        if(err){
          return res.send(err);
        }else{
          return res.send(rows);
        }
      }
    );
  });

  //연간 총 매출액 (이번 해 매출)
  app.get('/api/adminClientSalesAnalysis1',(req,res,err)=>{
    connection.query('SELECT sum(price) as sum from ticketing where YEAR(ticketing_date) = YEAR(sysdate()) ',
    (err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  });
  //월간 총 매출액(이번 달)
  app.get('/api/adminClientSalesAnalysis2',(req,res,err)=>{
    connection.query('SELECT sum(price) as sum from ticketing where MONTH(ticketing_date) = MONTH(sysdate()) and YEAR(ticketing_date) = YEAR(sysdate())',(err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  });
  
  //일일 총 매출액(오늘 날짜)
  app.get('/api/adminClientSalesAnalysis3',(req,res,err)=>{
    connection.query('SELECT sum(price) as sum from ticketing where DATE(ticketing_date) = DATE(sysdate()) and MONTH(ticketing_date) = MONTH(sysdate()) and YEAR(ticketing_date) = YEAR(sysdate())',(err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  });
 
  //회원매출분석> 연간 매출액 쿼리문
  app.get('/api/clientSalesYearlyChart',(req,res,err)=>{
    connection.query('select year(ticketing_date) as yyyy , sum(price) as sum  from ticketing where year(ticketing_date)  between year(now())-2 and year(now()) group by year(ticketing_date)  order by yyyy',
    (err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })
  
  //회원매출분석 > 연간 환불액 쿼리문
  app.get('/api/clientSalesYearlyRefundAnalysis',(req,res,err)=>{
    connection.query('select year(refund_apply_date) as ryyyy , sum(price) as rsum from ticketing where year(refund_apply_date) between year(now())-2 and year(now()) group by year(refund_apply_date)  order by ryyyy'
    ,(err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })

  //회원매출분석 > 월간 매출액 쿼리문
  app.get('/api/clietMonthlySalesAnalysis',(req,res,err)=>{
    connection.query('select month(ticketing_date) as mm , sum(price) as sum from ticketing where (ticketing_date) between (date_add(now(),interval -2 month)) and (now()) group by month(ticketing_date) order by mm'
    ,(err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })
  //회원매출분석 > 월간 환불액 쿼리문
  app.get('/api/clientSalesMonthlyRefundAnalysis',(req,res,err)=>{
    connection.query('select month(refund_apply_date) as mm , sum(price) as sum from ticketing where (refund_apply_date) between (date_add(now(),interval -2 month)) and (now()) group by month(refund_apply_date) order by mm'
    ,(err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })

  //회원매출분석 > 주간매출
  app.get('/api/clientSalesWeeklyAnalysis',(req,res,err)=>{
    connection.query('SELECT DATE_FORMAT(DATE_SUB(`ticketing_date`, INTERVAL (DAYOFWEEK(`ticketing_date`)-1) DAY), "%Y/%m/%d") as start, DATE_FORMAT(DATE_SUB(`ticketing_date`, INTERVAL (DAYOFWEEK(`ticketing_date`)-7) DAY), "%Y/%m/%d") as end, DATE_FORMAT(`ticketing_date`, "%Y-%m-%U") AS `date`, date_format(now(),"%Y-%m-%U") as now, sum(`price`)as sum FROM ticketing where DATE_FORMAT(`ticketing_date`, "%U") between date_format(now(),"%U")- 2 and date_format(now(),"%U") GROUP BY date order by date asc',
    (err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })
  //회원매출분석 >주간환불
  app.get('/api/clientSalesWeeklyRefundAnalysis',(req,res,err)=>{
    connection.query('SELECT DATE_FORMAT(DATE_SUB(`refund_apply_date`, INTERVAL (DAYOFWEEK(`refund_apply_date`)-1) DAY), "%Y/%m/%d") as start, DATE_FORMAT(DATE_SUB(`refund_apply_date`, INTERVAL (DAYOFWEEK(`refund_apply_date`)-7) DAY), "%Y/%m/%d") as end, DATE_FORMAT(`refund_apply_date`, "%Y-%m-%U") AS `date`, date_format(now(),"%Y-%m-%U") as now, sum(`price`) as sum FROM ticketing where DATE_FORMAT(`refund_apply_date`, "%U") between date_format(now(),"%U")- 2 and date_format(now(),"%U") GROUP BY date order by date asc',
    (err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })
  //회원 매출 분석 > 일간 매출
  app.get('/api/clientDailySalesAnalysis',(req,res,err)=>{
    connection.query('select DATE(ticketing_date) as dd , sum(price) as sum from ticketing where DATE(ticketing_date) between DATE(now())-2 and DATE(now()) group by DATE(ticketing_date) order by dd',
    (err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })
  //회원 매출 분석 > 일간 환불
  app.get('/api/clientSalesDailyRefundAnalysis',(req,res,err)=>{
    connection.query('select DATE(refund_apply_date) as dd , sum(price) as sum from ticketing where DATE(refund_apply_date) between DATE(now())-2 and DATE(now()) group by DATE(refund_apply_date) order by dd',
    (err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })

  /*
  app.get('/api/clientSalesAnalysis',(req,res,err)=>{
    connection.query('',(err,rows,fields) => {
      if(err){
        return res.send(err);
      }else{
        return res.send(rows);
      }
    })
  })
  */
 
 // connection.end();

 //사장님 관리 리스트
 app.get('/api/ceoManagement',(req,res) => {
  connection.query(
    "select t.troup_name, u.user_id, u.`name`, u.email, u.identification_number from user u, troup t where u.user_id = t.user_id and u.role = 'ceo'",
    (err,rows,fields) => {
      res.send(rows);
    }
  );
});

//회원 관리 리스트
app.get('/api/userManagement',(req,res) => {
connection.query(
  "select u.user_id, u.name, u.identification_number, u.email, f.funnel_name from user u, funnel f where u.funnel_id = f.funnel_id and u.role = 'client'",
  (err,rows,fields) => {
    res.send(rows);
  }
);
});


//블랙리스트 관리
app.get('/api/blacklistManagement',(req,res) => {
  connection.query(
    "select b.blacklist_id, b.user_id, b.reason_id, b.name, b.email, b.role, b.phone, b.delete_date, r.reason_content from blacklist b, reason r where b.reason_id = r.reason_id",
    (err,rows,fields) => {
      res.send(rows);
    }
  );
  });


//사장님 계정 삭제
app.delete('/api/userManagement/:identification_number',(req, res) => {
  let sql = 'delete from user where identification_number = ?';
  let params = [req.params.identification_number];
  connection.query(sql, params,
    (err, rows, fields) => {
      res.send(rows);
    })
});

//회원 계정 삭제
app.delete('/api/userManagement/:identification_number',(req, res) => {
  let sql = 'delete from user where identification_number = ?';
  let params = [req.params.identification_number];
  connection.query(sql, params,
    (err, rows, fields) => {
      res.send(rows);
    })
});

//블랙리스트 등록
app.post('/api/blacklistManagement',(req,res)=>{
  let sql = 'INSERT INTO blacklist VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  let blacklist_id = req.body.blacklist_id;
  let user_id = req.body.user_id;
  let reason_id = req.body.reason_id;
  let name = req.body.name;
  let email = req.body.email;
  let role = req.body.role;
  let phone = req.body.phone;
  let delete_date = req.body.delete_date;
  let params = [blacklist_id, user_id, reason_id, name, email, role, phone, delete_date];
  connection.query(sql, params,
        (err, rows, fields) => { 
                res.send(rows);
        }       
      )

});



app.listen(port, () => console.log(`Listening on port ${port}`));
