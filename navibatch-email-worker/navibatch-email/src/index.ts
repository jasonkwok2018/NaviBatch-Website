/**
 * NaviBatch Email Worker - Handles contact form submissions with image attachments
 */

interface EmailImage {
	name: string;
	content: string; // base64 content
	size: number;
	type: string;
}

interface ContactFormData {
	name: string;
	email: string;
	inquiryType: string;
	subject?: string;
	message: string;
	time?: string;
	images?: EmailImage[];
}

export default {
	async fetch(request, env, ctx): Promise<Response> {
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				status: 200,
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'POST, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type',
					'Access-Control-Max-Age': '86400',
				},
			});
		}

		// Only allow POST requests
		if (request.method !== 'POST') {
			return new Response('Method not allowed', {
				status: 405,
				headers: {
					'Access-Control-Allow-Origin': '*',
				}
			});
		}

		try {
			const formData: ContactFormData = await request.json();

			// Validate required fields
			if (!formData.name || !formData.email || !formData.message) {
				return new Response(JSON.stringify({
					success: false,
					error: 'Missing required fields'
				}), {
					status: 400,
					headers: {
						'Content-Type': 'application/json',
						'Access-Control-Allow-Origin': '*',
					}
				});
			}

			// Determine recipient email based on inquiry type
			const toEmail = formData.inquiryType === 'technical' ? 'supports@navibatch.com' : 'info@navibatch.com';

			// Prepare email content
			const subject = formData.subject || `NaviBatch Contact: ${formData.inquiryType || 'General'}`;

			let emailBody = `
New Contact Form Submission

Name: ${formData.name}
Email: ${formData.email}
Inquiry Type: ${formData.inquiryType || 'General'}
Subject: ${formData.subject || 'N/A'}
Time: ${formData.time || new Date().toLocaleString()}

Message:
${formData.message}

---
This email was automatically sent from the NaviBatch website contact form
`;

			// Handle images if present
			let hasImages = false;
			let imageCount = 0;

			if (formData.images && Array.isArray(formData.images) && formData.images.length > 0) {
				hasImages = true;
				imageCount = formData.images.length;

				emailBody += `\n\n--- Attached Images ---\n`;

				formData.images.forEach((image, index) => {
					emailBody += `Image ${index + 1}: ${image.name} (${formatFileSize(image.size)})\n`;
				});

				emailBody += `\nNote: ${imageCount} image(s) were uploaded with this message.\n`;
				emailBody += `Images are included as base64 data. Please contact the user directly for full resolution images if needed.\n`;
			}

			// Try to send email using Resend if API key is available
			if (env.RESEND_API_KEY) {
				try {
					const emailSent = await sendViaResend(toEmail, subject, emailBody, formData.images || [], env);
					if (emailSent) {
						return new Response(JSON.stringify({
							success: true,
							message: 'Email sent successfully via Resend',
							method: 'resend',
							hasImages: hasImages,
							imageCount: imageCount
						}), {
							status: 200,
							headers: {
								'Content-Type': 'application/json',
								'Access-Control-Allow-Origin': '*',
							}
						});
					}
				} catch (error) {
					console.error('Resend failed:', error);
				}
			}

			// Fallback to mailto
			const mailtoUrl = createMailtoUrl(toEmail, subject, emailBody);

			return new Response(JSON.stringify({
				success: true,
				message: 'Email client will be opened',
				method: 'mailto',
				mailto_url: mailtoUrl,
				hasImages: hasImages,
				imageCount: imageCount
			}), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				}
			});

		} catch (error) {
			console.error('Worker error:', error);

			return new Response(JSON.stringify({
				success: false,
				error: 'Internal server error: ' + (error as Error).message
			}), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				}
			});
		}
	},
} satisfies ExportedHandler<Env>;

// Send via Resend
async function sendViaResend(toEmail: string, subject: string, body: string, images: EmailImage[], env: any): Promise<boolean> {
	const attachments = images.map(image => ({
		filename: image.name,
		content: image.content
	}));

	const emailData = {
		from: 'NaviBatch Contact <noreply@navibatch.com>',
		to: [toEmail],
		subject: subject,
		text: body,
		attachments: attachments
	};

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${env.RESEND_API_KEY}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(emailData)
	});

	return response.ok;
}

// Create mailto URL
function createMailtoUrl(toEmail: string, subject: string, body: string): string {
	const encodedSubject = encodeURIComponent(subject);
	const encodedBody = encodeURIComponent(body);
	return `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}

// Format file size
function formatFileSize(bytes: number): string {
	if (bytes === 0) return '0 Bytes';
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
