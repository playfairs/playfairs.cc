import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { getSession } from "~/sessions";
import fs from "fs/promises";
import path from "path";
import { Client } from "discord.js-selfbot-v13";

// Path to the Discord configuration file
const DISCORD_CONFIG_PATH = path.join(process.cwd(), "app", "discord-config.json");

// Default configuration
const DEFAULT_CONFIG = {
  userId: "",
  botToken: "",
  displayName: "",
  avatarUrl: "",
  status: "",
  customStatus: ""
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Ensure only admin can access this route
  if (!session.get("isAdmin")) {
    return redirect("/login");
  }
  
  try {
    // Try to read existing configuration
    const configContent = await fs.readFile(DISCORD_CONFIG_PATH, "utf-8");
    return JSON.parse(configContent);
  } catch {
    // If no config exists, return default
    return DEFAULT_CONFIG;
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Ensure only admin can modify
  if (!session.get("isAdmin")) {
    return redirect("/login");
  }

  const formData = await request.formData();
  
  // Validate inputs
  const userId = formData.get("userId")?.toString().trim();
  const botToken = formData.get("botToken")?.toString().trim();
  const displayName = formData.get("displayName")?.toString().trim();
  const avatarUrl = formData.get("avatarUrl")?.toString().trim();
  const status = formData.get("status")?.toString().trim();
  const customStatus = formData.get("customStatus")?.toString().trim();

  // Validation errors
  const errors: { [key: string]: string } = {};
  
  // Validate User ID (should be a valid Discord snowflake)
  if (!userId || !/^\d{17,19}$/.test(userId)) {
    errors.userId = "Invalid Discord User ID. Must be a 17-19 digit number.";
  }

  // Validate Bot Token (basic format check)
  if (!botToken || botToken.length < 59) {
    errors.botToken = "Invalid Bot Token. Please provide a valid token.";
  }

  // Optional validation for other fields
  if (displayName && (displayName.length < 2 || displayName.length > 32)) {
    errors.displayName = "Display name must be between 2 and 32 characters.";
  }

  // If there are errors, return them
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Attempt to validate Discord credentials
  try {
    const client = new Client({ checkUpdate: false });
    await client.login(botToken);
    
    // Fetch user to validate
    const user = await client.users.fetch(userId);
    
    // Close the client
    await client.destroy();

    // Create configuration object
    const newConfig = {
      userId,
      botToken,
      displayName: displayName || user.username,
      avatarUrl: avatarUrl || user.avatarURL() || "",
      status: status || user.presence?.status || "",
      customStatus: customStatus || ""
    };

    // Write configuration to file
    await fs.writeFile(DISCORD_CONFIG_PATH, JSON.stringify(newConfig, null, 2));

    // Redirect to admin dashboard with success
    return redirect("/admin?message=Discord integration updated successfully");
  } catch (error) {
    // Authentication or fetching failed
    return { 
      errors: { 
        general: "Failed to authenticate with Discord. Please check your credentials."
      } 
    };
  }
};

export default function DiscordConfiguration() {
  const config = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Discord Integration
        </h1>
        
        {actionData?.errors?.general && (
          <div className="bg-red-900 text-red-300 p-4 rounded-lg mb-6 text-center">
            {actionData.errors.general}
          </div>
        )}

        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="userId" className="block text-gray-300 mb-2">
              Discord User ID
            </label>
            <input 
              type="text" 
              id="userId" 
              name="userId" 
              defaultValue={config.userId}
              placeholder="Enter your Discord User ID"
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.userId ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
              required
            />
            {actionData?.errors?.userId && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.userId}</p>
            )}
          </div>

          <div>
            <label htmlFor="botToken" className="block text-gray-300 mb-2">
              Bot Token
            </label>
            <input 
              type="password" 
              id="botToken" 
              name="botToken" 
              defaultValue={config.botToken}
              placeholder="Enter your Discord Bot Token"
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.botToken ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
              required
            />
            {actionData?.errors?.botToken && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.botToken}</p>
            )}
          </div>

          <div>
            <label htmlFor="displayName" className="block text-gray-300 mb-2">
              Display Name (Optional)
            </label>
            <input 
              type="text" 
              id="displayName" 
              name="displayName" 
              defaultValue={config.displayName}
              placeholder="Custom display name"
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.displayName ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
            />
            {actionData?.errors?.displayName && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.displayName}</p>
            )}
          </div>

          <div>
            <label htmlFor="status" className="block text-gray-300 mb-2">
              Status
            </label>
            <select 
              id="status" 
              name="status" 
              defaultValue={config.status}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg"
            >
              <option value="">Select Status</option>
              <option value="online">Online</option>
              <option value="idle">Idle</option>
              <option value="dnd">Do Not Disturb</option>
              <option value="offline">Offline</option>
            </select>
          </div>

          <div>
            <label htmlFor="customStatus" className="block text-gray-300 mb-2">
              Custom Status (Optional)
            </label>
            <input 
              type="text" 
              id="customStatus" 
              name="customStatus" 
              defaultValue={config.customStatus}
              placeholder="Enter custom status"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Save Discord Configuration
          </button>
        </Form>
      </div>
    </div>
  );
}
