import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        team: resolve(__dirname, 'pages/team.html'),
        problems: resolve(__dirname, 'pages/problems.html'),
        progress: resolve(__dirname, 'pages/progress.html'),
        admin: resolve(__dirname, 'pages/admin/index.html'),
        mentor: resolve(__dirname, 'pages/mentor/dashboard.html'),
        mentors: resolve(__dirname, 'pages/mentors.html'),
        submit: resolve(__dirname, 'pages/submit.html'),
      },
    },
  },
});
