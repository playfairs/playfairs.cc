import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";
import { redirect } from "@remix-run/node";
import { commitSession, getSession } from "~/sessions";

// Hardcoded admin credentials (in a real app, use secure environment variables)
const ADMIN_USERNAME = "playfairs";
const ADMIN_PASSWORD = "8462PlayfairDisplay.cc";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // If already logged in, redirect to admin dashboard
  if (session.get("isAdmin")) {
    return redirect("/admin");
  }
  
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const username = formData.get("username");
  const password = formData.get("password");

  const session = await getSession(request.headers.get("Cookie"));

  // Strict comparison with hardcoded credentials
  if (
    username === ADMIN_USERNAME && 
    password === ADMIN_PASSWORD
  ) {
    // Set admin session
    session.set("isAdmin", true);
    
    // Redirect to admin dashboard with session cookie
    return redirect("/admin", {
      headers: {
        "Set-Cookie": await commitSession(session)
      }
    });
  }

  // Authentication failed
  return { 
    errors: { 
      login: "Invalid admin credentials" 
    } 
  };
};

export default function AdminLogin() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-800 shadow-2xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Admin Login
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-gray-300 mb-2">
              Username
            </label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-gray-300 mb-2">
              Password
            </label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {actionData?.errors?.login && (
            <div className="text-red-400 text-sm text-center">
              {actionData.errors.login}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Log In
          </button>
        </Form>

        <div className="mt-4 text-center text-gray-500 text-sm">
          <p>Restricted Access: Admin Only</p>
        </div>

        <div className="mt-4 text-center">
          <a 
            href="/" 
            className="text-blue-400 hover:underline hover:text-blue-300 transition duration-300"
          >
            Lost? Here's the Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
