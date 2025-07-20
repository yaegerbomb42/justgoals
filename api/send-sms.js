import emailjs from 'emailjs-com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { to, subject, body, from } = req.body;
  if (!to || !subject || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      {
        to_email: to,
        subject,
        message: body,
        from_name: from || 'JustGoals',
      },
      process.env.EMAILJS_USER_ID
    );
    return res.status(200).json({ success: true, result });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Failed to send SMS via EmailJS' });
  }
} 