"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

type SignUpValues = z.infer<typeof signUpSchema>

export default function SignUpPage() {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: "", password: "" },
  })

  // TODO: nối BE thật — gọi registerApi() khi có endpoint, tương tự sign-in.
  const onSubmit = form.handleSubmit(async () => {
    toast.error("Sign-up chưa nối BE — xem TODO trong lib/api/auth.api.ts")
  })

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
            </Field>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Sign up
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
