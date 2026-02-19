import { useState } from "react";
import useAuth from '../../../utils/useAuth'

export default function MainComponent() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { signInWithCredentials } = useAuth();

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await signInWithCredentials({
        email,
        password,
        callbackUrl: "/",
        redirect: true,
      });
    } catch (err) {
      console.log("error");
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
    console.log("outside error");
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-white p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-[400px] space-y-6 p-8 font-mono"
      >
        <h1 className="text-sm font-normal text-black/60 text-center">
          sign in to your account
        </h1>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs text-black/60">email</label>
            <input
              required
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black/10 bg-transparent px-4 py-3 text-base text-black outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-black/60">password</label>
            <input
              required
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-black/10 bg-transparent px-4 py-3 text-base text-black outline-none"
            />
          </div>
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-8 w-full bg-black px-4 py-3 text-sm font-normal text-white transition-opacity hover:opacity-90 disabled:opacity-50 rounded-md"
        >
          {loading ? "loading..." : "sign in"}
        </button>

        <a
          href="/account/signup"
          className="mt-4 block text-center text-sm text-black/60 hover:text-black"
        >
          create account
        </a>
      </form>
    </div>
  );
}


