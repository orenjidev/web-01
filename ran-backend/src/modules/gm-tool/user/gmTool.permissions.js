export const requireGmToolAccess = (req, res, next) => {
  const user = req.session?.user;

  if (!user) {
    return res.status(401).json({ ok: false, message: "UNAUTHORIZED" });
  }

  // adjust types if needed
  const allowedTypes = [50]; // GM, Admin, SuperAdmin

  if (!allowedTypes.includes(user.type)) {
    return res.status(403).json({ ok: false, message: "FORBIDDEN" });
  }

  next();
};
