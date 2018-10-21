var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function(req, res, next) {
	res.render("index", { title: "Superbug Server" });
});

router.get("/client", function(req, res, next){
	res.render("client", { title: "Superbug Client"});
});

module.exports = router;
