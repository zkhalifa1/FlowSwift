import React from 'react'
import InputField from './InputField'
import SubmitButton from './SubmitButton'
import FormError from './FormError'

const LoginForm = ({ email, setEmail, password, setPassword, onSubmit, isSigningIn, errorMessage }) => {
    return (
        <form onSubmit={onSubmit} className="space-y-5">
            <InputField
                label="Email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <InputField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <FormError message={errorMessage} />
            <SubmitButton isLoading={isSigningIn} label="Sign In" />
        </form>
    )
}

export default LoginForm