#!/bin/bash
npm run build
npx cap copy android
npx cap open android
