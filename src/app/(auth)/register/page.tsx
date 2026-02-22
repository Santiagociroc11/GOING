import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="absolute inset-0 z-0 bg-grid-slate-100 flex justify-center [mask-image:linear-gradient(to_bottom,white,transparent)]" />
            <div className="z-10 w-full flex justify-center">
                <RegisterForm />
            </div>
        </div>
    );
}
