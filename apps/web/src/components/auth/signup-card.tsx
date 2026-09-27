import * as React from "react"
import { useNavigate } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { ApiError } from "@/services/api"
import { useAppStore } from "@/store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MotionButton } from "@/components/motion/motion-button"
import { Checkbox } from "@/components/motion/motion-checkbox"

const EMAIL_RE = /^\S+@\S+\.\S+$/

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" {...props}>
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3h3.89c2.28-2.1 3.59-5.2 3.59-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.89-3c-1.08.73-2.46 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.92H1.29v3.09A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.31 14.33a7.2 7.2 0 0 1 0-4.63V6.61H1.29a12 12 0 0 0 0 10.81l4.02-3.09Z" />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.6 4.58 1.79l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.61l4.02 3.09C6.25 6.88 8.89 4.77 12 4.77Z"
      />
    </svg>
  )
}

function GithubMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 .5a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.49 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .5Z" />
    </svg>
  )
}

function getPasswordScore(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

const STRENGTH_LABEL = ["Weak", "Weak", "Fair", "Good", "Strong"]
const STRENGTH_COLOR = ["bg-destructive", "bg-destructive", "bg-amber-500", "bg-amber-500", "bg-emerald-500"]

// Only the very first character typed into an empty field gets the pop-in —
// animating every keystroke reads as noisy, not delightful. The real input
// stays transparent for that one moment only; from the second character on
// it's just a normal input.
function AnimatedInput({
  value,
  onChange,
  className,
  ...props
}: Omit<React.ComponentProps<"input">, "value" | "onChange"> & {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  const isFirstChar = value.length === 1

  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
          isFirstChar && "text-transparent caret-foreground",
          className
        )}
        {...props}
      />
      <AnimatePresence>
        {isFirstChar && (
          <motion.span
            key="first-char"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-base text-foreground md:text-sm"
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export type SignupCardProps = React.ComponentProps<"div">

function SignupCard({ className, ...props }: SignupCardProps) {
  const navigate = useNavigate()
  const signup = useAppStore((s) => s.signup)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [agreed, setAgreed] = React.useState<boolean | "indeterminate">(false)
  const [emailError, setEmailError] = React.useState<string | null>(null)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)

  const score = getPasswordScore(password)
  const isValid = name.trim().length > 0 && EMAIL_RE.test(email) && password.length >= 8 && agreed === true

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isValid || submitting) return

    setSubmitting(true)
    setEmailError(null)
    setFormError(null)
    try {
      await signup({ name: name.trim(), email, password })
      navigate({ to: "/dashboard" })
    } catch (err) {
      if (err instanceof ApiError && err.code === "EMAIL_TAKEN") {
        setEmailError(err.message)
      } else {
        setFormError(err instanceof ApiError ? err.message : "Something went wrong. Try again.")
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      data-slot="signup-card"
      className={cn("w-full max-w-sm rounded-2xl border bg-background p-6 shadow-sm", className)}
      {...props}
    >
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">Create an account</h2>
        <p className="text-sm text-muted-foreground">Start building with MorphUI in seconds.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <MotionButton type="button" variant="outline" whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
          <GoogleIcon className="size-4" />
          Google
        </MotionButton>
        <MotionButton type="button" variant="outline" whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
          <GithubMarkIcon className="size-4" />
          GitHub
        </MotionButton>
      </div>

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground">or continue with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="signup-name">Name</Label>
          <AnimatedInput
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ava Chen"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="signup-email">Email</Label>
          <AnimatedInput
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError(null)
            }}
            placeholder="ava@morphui.dev"
          />
          {emailError && <p className="text-sm text-destructive">{emailError}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={showPassword ? "hide" : "show"}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="flex"
                >
                  {showPassword ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5 pt-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <span key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                      <motion.span
                        className={cn("block h-full rounded-full", STRENGTH_COLOR[score])}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: i < score ? 1 : 0 }}
                        style={{ transformOrigin: "left" }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    </span>
                  ))}
                </div>
                <p className="pt-1 text-xs text-muted-foreground">{STRENGTH_LABEL[score]} password</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox id="signup-terms" checked={agreed} onCheckedChange={setAgreed} />
          <label htmlFor="signup-terms" className="text-sm whitespace-nowrap text-muted-foreground">
            I agree to the{" "}
            <a href="#" className="text-foreground underline underline-offset-4">
              Terms
            </a>{" "}
            &{" "}
            <a href="#" className="text-foreground underline underline-offset-4">
              Privacy Policy
            </a>
            .
          </label>
        </div>

        <AnimatePresence initial={false}>
          {formError && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden text-sm text-destructive"
            >
              {formError}
            </motion.p>
          )}
        </AnimatePresence>

        <MotionButton type="submit" disabled={!isValid || submitting} className="w-full">
          {submitting ? (
            <span className="inline-flex items-center gap-1.5">
              <Loader2Icon className="size-4 animate-spin" />
              Creating account…
            </span>
          ) : (
            "Create account"
          )}
        </MotionButton>
      </form>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </a>
      </p>
    </div>
  )
}

export { SignupCard }
