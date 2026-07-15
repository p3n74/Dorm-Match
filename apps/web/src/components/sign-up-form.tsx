import { Badge } from "@DormMatch/ui/components/badge";
import { Button } from "@DormMatch/ui/components/button";
import { Card, CardContent } from "@DormMatch/ui/components/card";
import { Input } from "@DormMatch/ui/components/input";
import { Label } from "@DormMatch/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { trpcClient } from "@/utils/trpc";

import Loader from "./loader";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate({
    from: "/",
  });
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
      role: "tenant" as "tenant" | "dorm_owner",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: async () => {
            await trpcClient.profile.setRole.mutate({ role: value.role });
            navigate({
              to: "/onboarding",
            });
            toast.success("Sign up successful");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        role: z.enum(["tenant", "dorm_owner"]),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <Card className="mx-auto mt-12 w-full max-w-md rounded-3xl border border-blue-100 bg-white shadow-2xl shadow-blue-200/50">
      <CardContent className="pt-6">
      <div className="mb-6 text-center">
        <Badge className="mb-3 rounded-full border border-[#BFDBFE] bg-[#DBEAFE] px-4 py-1 text-[#0F3D73]">
  Join DormMatch
</Badge>
        <h1 className="text-4xl font-black tracking-tight text-[#1E293B]">Create Account</h1>
        <p className="mt-2 text-sm text-[#64748B]">Start matching with dorms and roommates in minutes.</p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4"
      >
        <div>
          <form.Field name="name">
            {(field) => (
              <div className="space-y-2">
                <Label
                htmlFor={field.name}
                className="font-semibold text-[#1E293B]"
                >Name</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-2">
                <Label
  htmlFor={field.name}
  className="font-semibold text-[#1E293B]"
>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="role">
            {(field) => (
              <div className="space-y-2">
               <Label
  htmlFor={field.name}
  className="font-semibold text-[#1E293B]"
>I am a</Label>
                <select
                  id={field.name}
                  className="h-11 w-full rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-2 text-sm font-medium text-[#1E293B] focus:border-[#2563EB] focus:outline-none"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value as "tenant" | "dorm_owner")}
                >
                  <option value="tenant">Tenant (looking for a dorm)</option>
                  <option value="dorm_owner">Dorm owner / landlord</option>
                </select>
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-2">
                <Label
  htmlFor={field.name}
  className="font-semibold text-[#1E293B]"
>Password</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-red-500">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe
          selector={(state) => ({ canSubmit: state.canSubmit, isSubmitting: state.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button
  type="submit"
  className="w-full rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-300/40 hover:bg-[#1D4ED8]" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Submitting..." : "Sign Up"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="mt-4 text-center">
        <Button
          variant="link"
          onClick={onSwitchToSignIn}
          className="font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
        >
          Already have an account? Sign In
        </Button>
      </div>
      </CardContent>
    </Card>
  );
}
