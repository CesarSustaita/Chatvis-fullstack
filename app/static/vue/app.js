import { createApp } from 'vue';
import MyComponent from './testComponent.vue';

const app = createApp({
  components: {
    MyComponent
  }
});

app.mount('#app'); 
