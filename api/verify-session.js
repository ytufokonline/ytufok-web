import { getAuthenticatedAdmin } from './_security.js';

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-token');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // İstek başlığındaki imzalı token'ı doğrula
  const admin = getAuthenticatedAdmin(req);

  if (!admin) {
    return res.status(401).json({
      valid: false,
      message: 'Geçersiz veya süresi dolmuş oturum.'
    });
  }

  return res.status(200).json({
    valid: true,
    admin: {
      id: admin.id,
      student_number: admin.student_number,
      full_name: admin.full_name,
      role: admin.role,
      title: admin.title,
      short_title: admin.short_title,
      avatar_color: admin.avatar_color
    }
  });
}
