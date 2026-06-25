const { body, param, validationResult } = require('express-validator');

function handleErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, error: errors.array()[0].msg });
  }
  next();
}

const login = [
  body('username').trim().notEmpty().withMessage('Usuario requerido'),
  body('password').trim().notEmpty().withMessage('Contraseña requerida'),
  handleErrors
];

const product = [
  body('name').trim().notEmpty().withMessage('Nombre del producto requerido').isLength({ max: 200 }).withMessage('Máximo 200 caracteres'),
  body('series').trim().notEmpty().withMessage('Serie requerida').isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
  body('description').trim().notEmpty().withMessage('Descripción requerida').isLength({ max: 2000 }).withMessage('Máximo 2000 caracteres'),
  body('price').isFloat({ min: 0.01, max: 99999 }).withMessage('Precio inválido (0.01–99999)'),
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating 0–5'),
  body('image').optional().trim().isLength({ max: 50000 }).withMessage('Imagen demasiado grande'),
  body('tag').optional().trim().isLength({ max: 30 }),
  body('tagText').optional().trim().isLength({ max: 30 }),
  handleErrors
];

const idParam = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  handleErrors
];

const order = [
  body('items').isArray({ min: 1 }).withMessage('Debe incluir al menos un item'),
  body('items.*.productId').isInt({ min: 1 }).withMessage('ID de producto inválido'),
  body('items.*.name').trim().notEmpty().withMessage('Nombre del item requerido'),
  body('items.*.price').isFloat({ min: 0 }).withMessage('Precio del item inválido'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Cantidad inválida'),
  body('customer').isObject().withMessage('Datos del cliente requeridos'),
  body('customer.name').trim().notEmpty().withMessage('Nombre del cliente requerido').isLength({ max: 200 }),
  body('customer.email').trim().isEmail().withMessage('Email inválido'),
  body('customer.address').trim().notEmpty().withMessage('Dirección requerida').isLength({ max: 500 }),
  body('payment').notEmpty().withMessage('Método de pago requerido'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal inválido'),
  body('shipping').isFloat({ min: 0 }).withMessage('Costo de envío inválido'),
  body('tax').isFloat({ min: 0 }).withMessage('Impuesto inválido'),
  body('total').isFloat({ min: 0 }).withMessage('Total inválido'),
  body('couponCode').optional().trim().isLength({ max: 30 }),
  body('discount').optional().isFloat({ min: 0 }),
  handleErrors
];

const orderStatus = [
  param('id').matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i).withMessage('ID de pedido inválido'),
  body('status').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Estado inválido'),
  handleErrors
];

const coupon = [
  body('code').trim().notEmpty().withMessage('Código requerido').isLength({ max: 30 }).withMessage('Máximo 30 caracteres'),
  body('type').isIn(['percentage', 'fixed']).withMessage('Tipo inválido (percentage o fixed)'),
  body('value').isFloat({ min: 0.01, max: 99999 }).withMessage('Valor inválido'),
  body('minPurchase').optional().isFloat({ min: 0 }),
  body('expiresAt').optional().isISO8601().withMessage('Fecha inválida (YYYY-MM-DD)'),
  body('maxUses').optional().isInt({ min: 1 }),
  handleErrors
];

const couponUpdate = [
  param('id').isInt({ min: 1 }).withMessage('ID inválido'),
  body('code').optional().trim().isLength({ max: 30 }),
  body('type').optional().isIn(['percentage', 'fixed']),
  body('value').optional().isFloat({ min: 0.01, max: 99999 }),
  body('minPurchase').optional().isFloat({ min: 0 }),
  body('expiresAt').optional().isISO8601(),
  body('maxUses').optional().isInt({ min: 1 }),
  body('active').optional().isBoolean(),
  handleErrors
];

const couponValidate = [
  body('code').trim().notEmpty().withMessage('Código requerido').isLength({ max: 30 }),
  body('subtotal').isFloat({ min: 0 }).withMessage('Subtotal inválido'),
  handleErrors
];

module.exports = { login, product, idParam, order, orderStatus, coupon, couponUpdate, couponValidate };
