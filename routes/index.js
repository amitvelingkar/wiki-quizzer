const express = require('express');
const router = express.Router();
const storeController = require('../controllers/StoreController');
const userController = require('../controllers/UserController');
const authController = require('../controllers/AuthController');
const reviewController = require('../controllers/ReviewController');
const categoryController = require('../controllers/CategoryController');
const topicController = require('../controllers/TopicController');
const { catchErrors } = require('../handlers/errorHandlers');

// Do work here
router.get('/', catchErrors(storeController.getStores));
router.get('/stores', catchErrors(storeController.getStores));
router.get('/stores/page/:page', catchErrors(storeController.getStores));
router.get('/add',
    authController.isLoggedIn,
    storeController.addStore
);
router.post('/add',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.createStore)
);
router.post('/add/:id',
    storeController.upload,
    catchErrors(storeController.resize),
    catchErrors(storeController.updateStore)
);
router.get('/stores/:id/edit', catchErrors(storeController.editStore));
router.get('/store/:slug', catchErrors(storeController.getStoreBySlug));

router.get('/tags', catchErrors(storeController.getStoresByTag));
router.get('/tags/:tag', catchErrors(storeController.getStoresByTag));

router.get('/hearts', authController.isLoggedIn,catchErrors(storeController.getHearts));

router.get('/login', userController.loginForm);
router.post('/login', authController.login);


router.get('/register', userController.registerForm);
// 1. validate the data
// 2. register the user
// 3. log the user in
router.post('/register',
    userController.validateRegister,
    userController.register,
    authController.login
);

router.get('/logout', authController.logout);

router.get('/account', userController.account);
router.post('/account',
    authController.isLoggedIn,
    catchErrors(userController.updateAccount)
);

router.post('/account/forgot', catchErrors(authController.forgot));
router.get('/account/reset/:token', catchErrors(authController.reset));
router.post('/account/reset/:token',
    authController.confirmPasswords,
    catchErrors(authController.update)
);

router.get('/map',storeController.showMap);

router.post('/reviews/:id',
    authController.isLoggedIn,
    catchErrors(reviewController.addReview)
);

router.get('/top', catchErrors(storeController.getTopStores));

router.get('/categories',
    authController.isLoggedIn,
    categoryController.getCategories
);

router.get('/category/add',
    authController.isLoggedIn,
    categoryController.addCategory
);

router.get('/category/:id/edit',
    authController.isLoggedIn,
    categoryController.editCategory
);


router.post('/category/add',
    catchErrors(categoryController.createCategory)
);

router.post('/category/add/:id',
    catchErrors(categoryController.updateCategory)
);

router.get('/category/:slug', catchErrors(categoryController.getCategoryBySlug));
router.get('/topic/:slug', catchErrors(topicController.getTopicBySlug));

router.get('/category/:slug/populate', catchErrors(categoryController.populateTopics));
router.get('/topic/:slug/populate', catchErrors(topicController.populateClues));
/*
    API
*/

router.get('/api/v1/search', catchErrors(storeController.searchStores));
router.get('/api/v1/stores/near', catchErrors(storeController.mapStores));
router.post('/api/v1/store/:id/heart', catchErrors(storeController.heartStore));
router.post('/api/v1/category/:id/addtopic', catchErrors(topicController.addTopic));
// TODO - remove
router.get('/api/v1/category/:id/populate', catchErrors(categoryController.populateTopics));


module.exports = router;
