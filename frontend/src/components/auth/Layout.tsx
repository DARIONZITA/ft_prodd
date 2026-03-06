import Logo from '../Logo'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex-1 flex justify-center px-4 pt-20 pb-10">
        <div className="w-full max-w-md">
          <div className="mb-14">
            <Logo iconSize={42} fontSize="26px" />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
