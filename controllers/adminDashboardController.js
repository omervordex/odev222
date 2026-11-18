const productModel = require('../models/productModel');
const categoryModel = require('../models/categoryModel');
const inquiryModel = require('../models/inquiryModel');

async function dashboard(req, res, next) {
  try {
    const [products, categories, inquiries, newInquiries, recentInquiries] = await Promise.all([
      productModel.countAll(),
      categoryModel.countAll(),
      inquiryModel.countAll(),
      inquiryModel.countByStatus('new'),
      inquiryModel.listAll()
    ]);

    res.status(200).render('admin/dashboard', {
      title: 'Panel',
      stats: {
        products,
        categories,
        inquiries,
        newInquiries
      },
      recentInquiries: recentInquiries.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  dashboard
};
