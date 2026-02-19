import { useState } from "react";
import useAuth from '../../../utils/useAuth'
import useUser from '../../../utils/useUser'

export default function MainComponent() {
  const { data: user } = useUser();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/",
      redirect: true,
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <div className="w-full max-w-[400px] space-y-6 p-8 font-mono">
        <h1 className="text-sm font-normal text-black/60">your account</h1>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-black/60">email</label>
            <div className="w-full border border-black/10 bg-transparent px-4 py-3">
              <p className="text-base text-black">
                {user?.email || "youremail@gmail.com"}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-black/60">password</label>
            <div className="w-full border border-black/10 bg-transparent px-4 py-3">
              <p className="text-base text-black">••••••••</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-8 w-full bg-black px-4 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90 rounded-md"
        >
          sign out
        </button>

        <a
          href="/account/signin"
          className="mt-4 block text-center text-sm text-black/60 hover:text-black"
        >
          sign in
        </a>
      </div>
    </div>
  );
}


