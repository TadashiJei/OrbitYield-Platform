const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../config/logger');

/**
 * Create a nodemailer transport
 * @returns {object} Nodemailer transport
 */
const createTransport = () => {
  if (process.env.NODE_ENV === 'production') {
    // Use production email service (e.g., SendGrid, Mailgun, etc.)
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } else {
    // Use ethereal for development (fake SMTP service)
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env.ETHEREAL_EMAIL_USERNAME || 'ethereal.user@ethereal.email',
        pass: process.env.ETHEREAL_EMAIL_PASSWORD || 'ethereal_password'
      }
    });
  }
};

/**
 * Render email template with handlebars
 * @param {string} templateName - Name of the template file without extension
 * @param {object} data - Data to be passed to the template
 * @returns {string} Rendered HTML
 */
const renderTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
    
    // If template file doesn't exist, use a default template
    if (!fs.existsSync(templatePath)) {
      logger.warn(`Email template ${templateName}.html not found. Using default template.`);
      
      // Create a simple default template
      const defaultTemplate = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>{{subject}}</h2>
          <div>
            {{#each dataPoints}}
              <p><strong>{{@key}}:</strong> {{this}}</p>
            {{/each}}
          </div>
          <p>Thank you for using OrbitYield!</p>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `;

      // Prepare data for default template
      const templateData = {
        subject: data.subject || 'OrbitYield Notification',
        dataPoints: data
      };

      const template = handlebars.compile(defaultTemplate);
      return template(templateData);
    }

    // Read and compile template
    const source = fs.readFileSync(templatePath, 'utf8');
    const template = handlebars.compile(source);
    return template(data);
  } catch (error) {
    logger.error(`Error rendering email template: ${error.message}`);
    throw error;
  }
};

/**
 * Send email
 * @param {object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {object} options.data - Data to be passed to the template
 * @returns {Promise} Promise resolving to email info
 */
exports.sendEmail = async (options) => {
  try {
    const { to, subject, template, data } = options;

    // Validate required fields
    if (!to || !subject || !template) {
      throw new Error('Missing required email options: to, subject, template');
    }

    // Create transport
    const transporter = createTransport();

    // Render HTML content
    const html = renderTemplate(template, data);

    // Define email options
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Email preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

/**
 * Create email directory structure and default templates
 * This function is called when the server starts
 */
exports.setupEmailTemplates = () => {
  try {
    const templatesDir = path.join(__dirname, '../templates/emails');
    
    // Create templates directory if it doesn't exist
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
      logger.info('Created email templates directory');
    }

    // Define default templates
    const defaultTemplates = {
      'welcome': `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Welcome to OrbitYield, {{username}}!</h2>
          <p>Thank you for joining OrbitYield. We're excited to help you maximize your DeFi yields.</p>
          <p>To get started, you can:</p>
          <ul>
            <li>Browse available yield strategies</li>
            <li>Connect your MetaMask wallet</li>
            <li>Set your risk preferences</li>
          </ul>
          <p>Please verify your email by clicking the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{verificationUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
          </div>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `,
      'password-reset': `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password for OrbitYield.</p>
          <p>If you did not make this request, please ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{resetUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
          </div>
          <p>This link will expire in 10 minutes.</p>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `,
      'metamask-removal-admin': `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>New MetaMask Disconnection Request</h2>
          <p>A user has requested to disconnect their MetaMask wallet.</p>
          <p><strong>Wallet Address:</strong> {{walletAddress}}</p>
          <p><strong>User Email:</strong> {{email}}</p>
          <p><strong>Reason:</strong> {{reason}}</p>
          <p><strong>Requested At:</strong> {{date}}</p>
          <p>Please review this request in the admin panel:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="{{adminUrl}}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Panel</a>
          </div>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `,
      'metamask-removal-user': `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>MetaMask Disconnection Request Received</h2>
          <p>We have received your request to disconnect your MetaMask wallet from OrbitYield.</p>
          <p><strong>Wallet Address:</strong> {{walletAddress}}</p>
          <p><strong>Requested At:</strong> {{date}}</p>
          <p>An administrator will review your request and process it accordingly. You will receive another email once the request has been processed.</p>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `,
      'metamask-removal-approved': `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>MetaMask Disconnection Request Approved</h2>
          <p>Your request to disconnect your MetaMask wallet from OrbitYield has been approved.</p>
          <p><strong>Wallet Address:</strong> {{walletAddress}}</p>
          <p><strong>Approved At:</strong> {{approvedAt}}</p>
          <p><strong>Admin Notes:</strong> {{adminNotes}}</p>
          <p>The wallet connection has been removed from our system.</p>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `,
      'metamask-removal-rejected': `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>MetaMask Disconnection Request Rejected</h2>
          <p>Your request to disconnect your MetaMask wallet from OrbitYield has been rejected.</p>
          <p><strong>Wallet Address:</strong> {{walletAddress}}</p>
          <p><strong>Rejected At:</strong> {{rejectedAt}}</p>
          <p><strong>Admin Notes:</strong> {{adminNotes}}</p>
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The OrbitYield Team</p>
        </div>
      `
    };

    // Create default templates if they don't exist
    Object.entries(defaultTemplates).forEach(([name, content]) => {
      const templatePath = path.join(templatesDir, `${name}.html`);
      if (!fs.existsSync(templatePath)) {
        fs.writeFileSync(templatePath, content.trim());
        logger.info(`Created default email template: ${name}.html`);
      }
    });
  } catch (error) {
    logger.error(`Error setting up email templates: ${error.message}`);
  }
};
