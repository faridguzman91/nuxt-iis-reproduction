<template>
  <div>
    <h1>Repro: <code>sendRedirect()</code> ignores <code>app.baseURL</code></h1>
    <p>Current <code>app.baseURL</code>: <code>{{ baseURL }}</code></p>

    <h2>Click both links and compare:</h2>

    <p>
      <a :href="`${baseURL}signin`">
        ❌ Server redirect — <code>sendRedirect(event, '/dashboard')</code>
      </a><br>
      Expected: <code>{{ baseURL }}dashboard</code><br>
      Actual: <code>/dashboard</code> → 404
    </p>

    <p>
      <NuxtLink to="/dashboard">
        ✅ Client nav — <code>&lt;NuxtLink to="/dashboard"&gt;</code>
      </NuxtLink><br>
      Correctly reaches <code>{{ baseURL }}dashboard</code>
    </p>
  </div>
</template>

<script setup>
const baseURL = useRuntimeConfig().app.baseURL
</script>
