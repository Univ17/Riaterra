import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Assets } from './game/assets';

Assets.load(); // start loading sprites right away; the game draws fallbacks until they are ready

createRoot(document.getElementById('root')!).render(<App />);
