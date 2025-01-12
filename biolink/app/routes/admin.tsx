import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, Link, useLoaderData } from "@remix-run/react";
import { getSession, destroySession } from "~/sessions";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Ensure only admin can access this route
  if (!session.get("isAdmin")) {
    return redirect("/login");
  }
  
  // Get URL search params
  const url = new URL(request.url);
  const message = url.searchParams.get("message");
  
  return { message };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const session = await getSession(request.headers.get("Cookie"));
  
  // Logout action
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session)
    }
  });
};

export default function AdminDashboard() {
  const { message } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-gray-800 shadow-2xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-400 mb-6 text-center">
          Admin Dashboard
        </h1>
        
        {message && (
          <div className="bg-green-900 text-green-300 p-4 rounded-lg mb-6 text-center">
            {message}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="bg-gray-700 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-blue-300 mb-4">
               Management
            </h2>
            <div className="space-y-4">
              <Link 
                to="/admin/customize" 
                className="block w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-300 text-center"
              >
                Customize Landing Page
              </Link>
              <Link 
                to="/admin/discord" 
                className="block w-full bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition duration-300 text-center"
              >
                Configure Discord
              </Link>
            </div>
          </div>

          <Form method="post" className="text-center">
            <button 
              type="submit" 
              className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition duration-300"
            >
              Logout
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
