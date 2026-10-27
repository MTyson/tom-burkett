import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!process.env.RESEND_API_KEY) {
            console.error('RESEND_API_KEY is not configured.');
            return res.status(500).json({ error: 'Server configuration error: RESEND_API_KEY missing.' });
        }

        const client = resend || new Resend(process.env.RESEND_API_KEY);
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
        const { name, phone, email, service, dueDate, message } = body;

        if (!name || !phone || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields: name, phone, email, and message are required.' });
        }

        const { data, error } = await client.emails.send({
            from: 'Home Inspection Detective <inspections@yhomeinspectiondetective.com>',
            to: 'tom@yhomeinspectiondetective.com',
            replyTo: email,
            reply_to: email,
            headers: {
                'Reply-To': email,
            },
            subject: `New Inspection Request: ${service || 'General'} from ${name}${dueDate ? ' (Due: ' + dueDate + ')' : ''}`,
            text: `Name: ${name}
Phone: ${phone}
Email: ${email}
Service / Inspection: ${service || 'General'}
Inspection Due Date: ${dueDate || 'Not specified'}

Property / Project Details:
${message}`,
        });

        if (error) {
            return res.status(400).json({ error: error.message || error });
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}