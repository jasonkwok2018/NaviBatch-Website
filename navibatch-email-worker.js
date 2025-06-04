// NaviBatch Email Worker - Handles contact form submissions with image attachments
// Deploy this to Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
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
      const formData = await request.json();
      
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
      let attachments = [];
      if (formData.images && Array.isArray(formData.images) && formData.images.length > 0) {
        emailBody += `\n\n--- Attached Images ---\n`;
        
        formData.images.forEach((image, index) => {
          emailBody += `Image ${index + 1}: ${image.name} (${formatFileSize(image.size)})\n`;
          
          // Add image as attachment
          attachments.push({
            filename: image.name,
            content: image.content,
            type: image.type || 'image/jpeg',
            disposition: 'attachment'
          });
        });
        
        emailBody += `\nNote: ${formData.images.length} image(s) attached to this email.\n`;
      }

      // Try to send email using multiple methods
      let emailSent = false;
      let lastError = null;

      // Method 1: Try using EmailJS-like service (if configured)
      if (env.EMAILJS_SERVICE_ID && env.EMAILJS_TEMPLATE_ID && env.EMAILJS_USER_ID) {
        try {
          const emailjsResponse = await sendViaEmailJS(formData, attachments, env);
          if (emailjsResponse.success) {
            emailSent = true;
          }
        } catch (error) {
          lastError = error;
          console.log('EmailJS failed:', error);
        }
      }

      // Method 2: Try using Resend (if configured)
      if (!emailSent && env.RESEND_API_KEY) {
        try {
          const resendResponse = await sendViaResend(toEmail, subject, emailBody, attachments, env);
          if (resendResponse.success) {
            emailSent = true;
          }
        } catch (error) {
          lastError = error;
          console.log('Resend failed:', error);
        }
      }

      // Method 3: Try using SendGrid (if configured)
      if (!emailSent && env.SENDGRID_API_KEY) {
        try {
          const sendgridResponse = await sendViaSendGrid(toEmail, subject, emailBody, attachments, env);
          if (sendgridResponse.success) {
            emailSent = true;
          }
        } catch (error) {
          lastError = error;
          console.log('SendGrid failed:', error);
        }
      }

      if (emailSent) {
        return new Response(JSON.stringify({
          success: true,
          message: 'Email sent successfully'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      } else {
        // Fallback to mailto if all methods fail
        const mailtoUrl = createMailtoUrl(toEmail, subject, emailBody);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Email client will be opened',
          method: 'mailto',
          mailto_url: mailtoUrl
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        });
      }

    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Internal server error'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};

// Send via Resend
async function sendViaResend(toEmail, subject, body, attachments, env) {
  const emailData = {
    from: 'NaviBatch Contact <noreply@navibatch.com>',
    to: [toEmail],
    subject: subject,
    text: body,
    attachments: attachments.map(att => ({
      filename: att.filename,
      content: att.content
    }))
  };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData)
  });

  if (response.ok) {
    return { success: true };
  } else {
    throw new Error(`Resend API error: ${response.status}`);
  }
}

// Send via SendGrid
async function sendViaSendGrid(toEmail, subject, body, attachments, env) {
  const emailData = {
    personalizations: [{
      to: [{ email: toEmail }],
      subject: subject
    }],
    from: { email: 'noreply@navibatch.com', name: 'NaviBatch Contact' },
    content: [{
      type: 'text/plain',
      value: body
    }],
    attachments: attachments.map(att => ({
      content: att.content,
      filename: att.filename,
      type: att.type,
      disposition: 'attachment'
    }))
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailData)
  });

  if (response.ok || response.status === 202) {
    return { success: true };
  } else {
    throw new Error(`SendGrid API error: ${response.status}`);
  }
}

// Send via EmailJS
async function sendViaEmailJS(formData, attachments, env) {
  const templateParams = {
    name: formData.name,
    email: formData.email,
    subject: formData.subject || formData.inquiryType,
    message: formData.message,
    inquiry_type: formData.inquiryType,
    time: formData.time || new Date().toLocaleString()
  };

  // Add image information to message if present
  if (attachments.length > 0) {
    templateParams.message += `\n\n--- Attached Images ---\n`;
    attachments.forEach((att, index) => {
      templateParams.message += `Image ${index + 1}: ${att.filename}\n`;
    });
    templateParams.message += `\nNote: ${attachments.length} image(s) were uploaded with this message.`;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      service_id: env.EMAILJS_SERVICE_ID,
      template_id: env.EMAILJS_TEMPLATE_ID,
      user_id: env.EMAILJS_USER_ID,
      template_params: templateParams
    })
  });

  if (response.ok) {
    return { success: true };
  } else {
    throw new Error(`EmailJS error: ${response.status}`);
  }
}

// Create mailto URL
function createMailtoUrl(toEmail, subject, body) {
  const encodedSubject = encodeURIComponent(subject);
  const encodedBody = encodeURIComponent(body);
  return `mailto:${toEmail}?subject=${encodedSubject}&body=${encodedBody}`;
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
