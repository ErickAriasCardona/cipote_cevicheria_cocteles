import { BrowserRouter } from 'react-router-dom'
import { SesionProvider } from './hooks/useSession'
import { ConfirmacionProvider } from './hooks/useConfirmacion'
import { ThemeProvider } from './theme/ThemeProvider'
import { AppRouter } from './router/AppRouter'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <SesionProvider>
          <ConfirmacionProvider>
            <AppRouter />
          </ConfirmacionProvider>
        </SesionProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
