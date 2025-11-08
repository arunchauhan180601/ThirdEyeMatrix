const express = require('express');
const { collectEvent, getMetrics, getVisitorJourney } = require('../controllers/PixelControllers/pixel.controller');

const router = express.Router();

router.post('/collect', collectEvent);
router.get('/metrics', getMetrics);
router.get('/visitors/:visitorId/journey', getVisitorJourney);

module.exports = router;

