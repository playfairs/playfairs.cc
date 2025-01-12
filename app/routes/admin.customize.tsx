import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { getSession } from "~/sessions";
import fs from "fs/promises";
import path from "path";

// Path to the configuration file
const CONFIG_PATH = path.join(process.cwd(), "app", "landing-config.json");

// Default configuration
const DEFAULT_CONFIG = {
  title: "Playfairs.cc",
  subtitle: "A simple Biolink made with Remix and Tailwind CSS just to test my skills.",
  backgroundColor: "bg-gray-900",
  textColor: "text-gray-100",
  accentColor: "text-blue-400"
};

// Color palettes
const COLOR_PALETTES = {
  dark: {
    backgroundColor: "bg-gray-900",
    textColor: "text-gray-100",
    accentColor: "text-blue-400"
  },
  light: {
    backgroundColor: "bg-gray-100",
    textColor: "text-gray-900",
    accentColor: "text-blue-600"
  },
  ocean: {
    backgroundColor: "bg-blue-900",
    textColor: "text-blue-100",
    accentColor: "text-teal-300"
  }
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Ensure only admin can access this route
  if (!session.get("isAdmin")) {
    return redirect("/login");
  }
  
  try {
    // Try to read existing configuration
    const configContent = await fs.readFile(CONFIG_PATH, "utf-8");
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
  const title = formData.get("title")?.toString().trim();
  const subtitle = formData.get("subtitle")?.toString().trim();
  const colorScheme = formData.get("colorScheme")?.toString();

  // Validation errors
  const errors: { [key: string]: string } = {};
  
  if (!title || title.length < 3) {
    errors.title = "Title must be at least 3 characters long";
  }

  if (!subtitle || subtitle.length < 10) {
    errors.subtitle = "Subtitle must be at least 10 characters long";
  }

  // If there are errors, return them
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // Determine color palette
  const palette = COLOR_PALETTES[colorScheme as keyof typeof COLOR_PALETTES] || COLOR_PALETTES.dark;

  // Create configuration object
  const newConfig = {
    title: title || DEFAULT_CONFIG.title,
    subtitle: subtitle || DEFAULT_CONFIG.subtitle,
    backgroundColor: palette.backgroundColor,
    textColor: palette.textColor,
    accentColor: palette.accentColor
  };

  // Write configuration to file
  await fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig, null, 2));

  // Redirect to admin dashboard with success
  return redirect("/admin?message=Landing page updated successfully");
};

export default function AdminCustomize() {
  const config = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Customize Landing Page
        </h1>
        
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-gray-300 mb-2">
              Title
            </label>
            <input 
              type="text" 
              id="title" 
              name="title" 
              defaultValue={config.title}
              placeholder="Enter page title"
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.title ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
              required
            />
            {actionData?.errors?.title && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="subtitle" className="block text-gray-300 mb-2">
              Subtitle
            </label>
            <textarea 
              id="subtitle" 
              name="subtitle" 
              defaultValue={config.subtitle}
              placeholder="Enter page subtitle"
              className={`w-full px-3 py-2 bg-gray-700 border ${actionData?.errors?.subtitle ? 'border-red-500' : 'border-gray-600'} text-gray-100 rounded-lg`}
              rows={3}
              required
            />
            {actionData?.errors?.subtitle && (
              <p className="text-red-400 text-sm mt-1">{actionData.errors.subtitle}</p>
            )}
          </div>

          <div>
            <label htmlFor="colorScheme" className="block text-gray-300 mb-2">
              Color Scheme
            </label>
            <select 
              id="colorScheme" 
              name="colorScheme" 
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg"
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
              <option value="ocean">Ocean</option>
            </select>
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Save Changes
          </button>
        </Form>
      </div>
    </div>
  );
}
