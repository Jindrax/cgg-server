module.exports = async function (req, res, proceed) {
  if (req.session.usuario) {
    return proceed();
  }
  return res.forbidden();
};