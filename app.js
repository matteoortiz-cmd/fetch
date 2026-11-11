const API_URL = "https://jsonplaceholder.typicode.com";

const listingView = document.querySelector("#listing-view");
const detailView = document.querySelector("#detail-view");
const postsContainer = document.querySelector("#posts");
const postCount = document.querySelector("#post-count");
const postDetail = document.querySelector("#post-detail");
const commentsList = document.querySelector("#comments-list");
const commentsCount = document.querySelector("#comment-count");
const commentForm = document.querySelector("#comment-form");
const submitButton = document.querySelector("#submit-comment");
const formMessage = document.querySelector("#form-message");

let activePostId = null;
let posts = [];

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`A API respondeu com o status ${response.status}.`);
  }
  return response.json();
}

function showError(container, message) {
  container.replaceChildren();
  const error = document.createElement("p");
  error.className = "error-message";
  error.textContent = message;
  container.append(error);
}

function renderPosts() {
  postsContainer.replaceChildren();
  const visiblePosts = posts.slice(0, 6);
  postCount.textContent = `${visiblePosts.length} publicações`;

  visiblePosts.forEach((post, index) => {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = `#post-${post.id}`;
    card.setAttribute("aria-label", `Ler publicação: ${post.title}`);

    const topline = document.createElement("div");
    topline.className = "card-topline";
    const label = document.createElement("span");
    label.className = "post-label";
    label.textContent = "Reflexões";
    const number = document.createElement("span");
    number.className = "post-number";
    number.textContent = String(index + 1).padStart(2, "0");
    topline.append(label, number);

    const title = document.createElement("h3");
    title.textContent = post.title;
    const excerpt = document.createElement("p");
    excerpt.textContent = post.body;
    const link = document.createElement("span");
    link.className = "card-link";
    link.append("Continuar lendo", Object.assign(document.createElement("span"), { textContent: "→" }));

    card.append(topline, title, excerpt, link);
    card.addEventListener("click", (event) => {
      event.preventDefault();
      openPost(post.id);
    });
    postsContainer.append(card);
  });
}

function renderPost(post) {
  postDetail.replaceChildren();
  const category = document.createElement("span");
  category.className = "section-kicker";
  category.textContent = "CADERNO DE IDEIAS  /  REFLEXÕES";

  const title = document.createElement("h1");
  title.textContent = post.title;
  const meta = document.createElement("p");
  meta.className = "post-meta";
  meta.textContent = `Publicado por leitor${post.userId}  ·  Publicação ${post.id}`;

  const body = document.createElement("div");
  body.className = "post-copy";
  post.body.split(/\n+/).forEach((paragraph) => {
    const text = document.createElement("p");
    text.textContent = paragraph;
    body.append(text);
  });
  postDetail.append(category, title, meta, body);
}

function renderComments(comments) {
  commentsList.replaceChildren();
  commentsCount.textContent = `(${comments.length})`;

  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "status-message";
    empty.textContent = "Ainda não há comentários. Que tal começar a conversa?";
    commentsList.append(empty);
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("article");
    item.className = "comment";
    const avatar = document.createElement("span");
    avatar.className = "comment-avatar";
    avatar.setAttribute("aria-hidden", "true");
    avatar.textContent = comment.name.trim().charAt(0).toUpperCase();

    const content = document.createElement("div");
    const author = document.createElement("p");
    author.className = "comment-author";
    author.append(document.createTextNode(comment.name));
    const email = document.createElement("span");
    email.className = "comment-email";
    email.textContent = comment.email;
    author.append(email);
    const body = document.createElement("p");
    body.className = "comment-body";
    body.textContent = comment.body;
    content.append(author, body);
    item.append(avatar, content);
    commentsList.append(item);
  });
}

async function openPost(postId) {
  activePostId = postId;
  listingView.hidden = true;
  detailView.hidden = false;
  history.replaceState(null, "", `#post-${postId}`);
  postDetail.replaceChildren();
  commentsList.replaceChildren();
  commentsCount.textContent = "";
  commentForm.reset();
  setFormMessage("");

  const postLoading = document.createElement("p");
  postLoading.className = "status-message";
  postLoading.textContent = "Carregando publicação...";
  postDetail.append(postLoading);
  const commentsLoading = document.createElement("p");
  commentsLoading.className = "status-message";
  commentsLoading.textContent = "Carregando comentários...";
  commentsList.append(commentsLoading);

  try {
    const [post, comments] = await Promise.all([
      fetchJson(`${API_URL}/posts/${postId}`),
      fetchJson(`${API_URL}/posts/${postId}/comments`),
    ]);
    if (activePostId !== postId) return;
    renderPost(post);
    renderComments(comments);
  } catch (error) {
    if (activePostId !== postId) return;
    showError(postDetail, "Não foi possível carregar esta publicação. Tente novamente.");
    showError(commentsList, "Não foi possível carregar os comentários.");
    console.error("Erro ao carregar publicação e comentários:", error);
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closePost() {
  activePostId = null;
  detailView.hidden = true;
  listingView.hidden = false;
  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setFormMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
}

async function submitComment(event) {
  event.preventDefault();
  if (!activePostId) return;

  const formData = new FormData(commentForm);
  const comment = {
    postId: activePostId,
    name: formData.get("name").trim(),
    email: formData.get("email").trim(),
    body: formData.get("body").trim(),
  };
  if (!comment.name || !comment.email || !comment.body) {
    setFormMessage("Preencha todos os campos para publicar.", true);
    return;
  }

  submitButton.disabled = true;
  setFormMessage("Enviando comentário...");
  try {
    const createdComment = await fetchJson(`${API_URL}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify(comment),
    });
    if (activePostId !== comment.postId) return;
    renderComments([
      { ...createdComment, ...comment },
      ...Array.from(commentsList.querySelectorAll(".comment")).map((item) => ({
        name: item.querySelector(".comment-author").childNodes[0].textContent,
        email: item.querySelector(".comment-email").textContent,
        body: item.querySelector(".comment-body").textContent,
      })),
    ]);
    commentForm.reset();
    setFormMessage("Seu comentário foi publicado. Obrigado por participar!");
  } catch (error) {
    setFormMessage("Não foi possível enviar seu comentário. Tente novamente.", true);
    console.error("Erro ao enviar comentário:", error);
  } finally {
    submitButton.disabled = false;
  }
}

async function loadPosts() {
  try {
    posts = await fetchJson(`${API_URL}/posts`);
    renderPosts();
  } catch (error) {
    showError(postsContainer, "Não foi possível carregar as publicações. Verifique sua conexão e tente novamente.");
    console.error("Erro ao carregar publicações:", error);
  }
}

document.querySelector("#back-button").addEventListener("click", closePost);
document.querySelector(".brand").addEventListener("click", (event) => {
  event.preventDefault();
  closePost();
});
commentForm.addEventListener("submit", submitComment);

loadPosts();
