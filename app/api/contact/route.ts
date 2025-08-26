import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // For now, we'll just log the data and return success
    // In production, you would use a service like:
    // - Nodemailer with SMTP
    // - SendGrid
    // - Resend
    // - AWS SES
    
    console.log('Form submission:', data);
    console.log('Would send email to: brian@spotcircuit.com');
    
    // Example with Resend (recommended for Next.js):
    // import { Resend } from 'resend';
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // 
    // await resend.emails.send({
    //   from: 'noreply@yourdomain.com',
    //   to: 'brian@spotcircuit.com',
    //   subject: `New Lead: ${data.businessName}`,
    //   html: `
    //     <h2>New Strategy Call Request</h2>
    //     <p><strong>Name:</strong> ${data.name}</p>
    //     <p><strong>Business:</strong> ${data.businessName}</p>
    //     <p><strong>Email:</strong> ${data.email}</p>
    //     <p><strong>Phone:</strong> ${data.phone || 'Not provided'}</p>
    //     <p><strong>Current Rank:</strong> ${data.currentRank || 'Not provided'}</p>
    //     <p><strong>Page:</strong> ${data.pageUrl || 'Not provided'}</p>
    //   `
    // });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Thank you! We\'ll contact you within 24 hours.' 
    });
    
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send message' },
      { status: 500 }
    );
  }
}