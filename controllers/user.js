const knex = require("../db/knex.js");
const hasher = require("../config/hasher.js");

module.exports = {
  home: function(req, res) {
    knex('user').then((results) => {
      if (req.session.errors) {
        req.session.errors = [];
      }
      res.render('index', {
        users: results,
        errors: req.session.errors
      });
    })
  },
  login: (req, res) => {
    console.log("running me");
    knex('user')
      .where('email', req.body.email)
      .then((result) => {
        let user = result[0];
        hasher.check(user, req.body).then((isMatch) => {
          if (isMatch) {
            req.session.user_id = user.id;
            req.session.user_type = user.user_type;
            req.session.save(() => {
              if (user.user_type === "charity") {
                res.redirect('/donations');

              } else if (user.user_type === "donor") {
                res.redirect('/createNew');
              }
            }).catch(() => {
              res.redirect('/');
            })
          }else{
            console.log("no match");
            res.redirect('/')
          }
        })
      })
  },
  register: (req, res) => {
    hasher.hash(req.body).then((user) => {
      knex('user').insert({
        name: user.name,
        password: user.password,
        email: user.email,
        phone: user.phone,
        avatar_img: user.avatar_img,
        user_type: user.user_type
      }).then(() => {
        res.redirect('/');
      }).catch(() => {
        req.session.errors.push('Registration Invalid')
      })
    })
  },
  createNew: (req, res)=>{
    if(req.session.user_type !== "donor"){
      res.redirect("/");
      return;
    }//add this route before any route that is only for donor access
    knex('user')
    .where('user.user_type', 'donor')
    .andWhere('user.id', req.session.user_id)
    .then(()=>{
      res.render('createNew');
    })
  },
  donations: (req, res)=>{
      if(req.session.user_type !== "charity"){
        res.redirect("/");
        return;
      }//add this before any route that is only for charity access
      knex('user')
      .where('user.user_type', 'charity')
      .andWhere('user.id', req.session.user_id)
      .then(()=>{
        knex('order')
        .then((data)=>{
          res.render('donations', {donations:data})
        })
      })
    }

}
