import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { WebhookClient } from 'discord.js';

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim();
  const message = formData.get("message")?.toString().trim();

  // Basic validation
  const errors: { [key: string]: string } = {};
  
  if (!name || name.length < 2) {
    errors.name = "Name must be at least 2 characters long";
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!message || message.length < 10) {
    errors.message = "Message must be at least 10 characters long";
  }

  // If there are validation errors, return them
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    // Support multiple webhook URLs separated by comma
    const webhookUrls = (process.env.DISCORD_COMMENT_WEBHOOK_URLS || '').split(',').filter(url => url.trim());

    // If no webhook URLs are configured, throw an error
    if (webhookUrls.length === 0) {
      throw new Error("No webhook URLs configured");
    }

    // Send to each webhook
    for (const webhookUrl of webhookUrls) {
      const webhookClient = new WebhookClient({ url: webhookUrl.trim() });

      await webhookClient.send({
        embeds: [{
          title: "New Website Message",
          color: 0x2563EB, // Tailwind blue-600
          fields: [
            { name: "Name", value: name, inline: true },
            { name: "Email", value: email, inline: true },
            { name: "Message", value: message }
          ],
          timestamp: new Date().toISOString(),
          footer: { text: "Biolink Website Message" }
        }]
      });
    }

    // Redirect with success message
    return redirect("/?message=Your message has been sent successfully!");
  } catch (error) {
    console.error("Error sending message:", error);
    return { 
      errors: { 
        general: error instanceof Error ? error.message : "Failed to send message. Please try again later." 
      } 
    };
  }
};

export default function MessagePage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Send a Message
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-300 mb-2">
              Your Name
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              required
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.name ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
            />
            {actionData?.errors?.name && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-300 mb-2">
              Your Email
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              required
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.email ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
            />
            {actionData?.errors?.email && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="message" className="block text-gray-300 mb-2">
              Your Message
            </label>
            <textarea 
              id="message" 
              name="message" 
              rows={4}
              required
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.message ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
            />
            {actionData?.errors?.message && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.message}</p>
            )}
          </div>

          {actionData?.errors?.general && (
            <div className="bg-red-900 text-red-300 p-4 rounded-lg">
              {actionData.errors.general}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Send Message
          </button>
        </Form>
      </div>
    </div>
  );
}
