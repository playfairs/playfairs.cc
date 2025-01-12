import type { ActionFunctionArgs } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const username = formData.get("username");
  const email = formData.get("email");

  // Basic validation
  const errors: { [key: string]: string } = {};
  if (!name) errors.name = "Name is required";
  if (!username) errors.username = "Username is required";
  if (!email) errors.email = "Email is required";

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  // TODO: Add actual user creation logic
  return { success: true, message: "BioLink created successfully!" };
};

export default function CreateBioLink() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-2xl rounded-xl p-8">
        <h1 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Create Your BioLink
        </h1>

        <Form method="post" className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-gray-700 mb-2">
              Full Name
            </label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {actionData?.errors?.name && (
              <p className="text-red-500 text-sm mt-1">
                {actionData.errors.name}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="username" className="block text-gray-700 mb-2">
              Username
            </label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {actionData?.errors?.username && (
              <p className="text-red-500 text-sm mt-1">
                {actionData.errors.username}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-gray-700 mb-2">
              Email
            </label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {actionData?.errors?.email && (
              <p className="text-red-500 text-sm mt-1">
                {actionData.errors.email}
              </p>
            )}
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Create BioLink
          </button>
        </Form>

        {actionData?.success && (
          <div className="mt-4 text-center text-green-600">
            {actionData.message}
          </div>
        )}
      </div>
    </div>
  );
}
