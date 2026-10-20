import logo from './assets/logos/Svg/Color-White-Logo.svg'
import { Calculator } from './components/Calculator'

export default function App() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-plum px-4 py-8 text-white">
      {/* The logo file has transparent padding; the negative margin trims it visually. */}
      <img src={logo} alt="Sezzle" className="-my-6 h-24" />
      <h1 className="text-2xl font-bold">Calculator</h1>
      <Calculator />
    </main>
  )
}
