import { createRoot } from 'react-dom/client';
import { createElement } from 'react';
import { App } from './App';
import './styles/global.css';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(createElement(App));
}
