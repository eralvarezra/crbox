import { render, screen } from '@testing-library/react'

function MonoText() {
  return <span className="font-mono" data-testid="mono">1Z999AA1</span>
}

test('font-mono class renders', () => {
  render(<MonoText />)
  expect(screen.getByTestId('mono')).toBeInTheDocument()
})
