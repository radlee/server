const { Router } = require('express')

const router = Router();

router.get('/', (req, res, next) => {
    res.json('Posts-Routes')
});

module.exports = router; 