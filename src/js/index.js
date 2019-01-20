import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Like';
import { elements, renderLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likeView';

const state = {};

const controlSearch = async () => {
	const query = searchView.getInput();

	if(query) {
		state.search = new Search(query);
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);
		try {
			await state.search.getResults();
			clearLoader();
			searchView.renderResults(state.search.result);
		} catch (error) {
			console.log(error);
			alert('Something went wrong!');
			clearLoader();
		}
	}
}

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault();
	controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline');
	if(btn) {
		const goToPage = parseInt(btn.dataset.goto, 10);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});

const controlRecipe = async () => {
	const id = window.location.hash.replace('#', '');

	if(id){
		recipeView.clearRecipe();
		renderLoader(elements.recipe);
		if(state.search) searchView.highlightSelected(id);
		state.recipe = new Recipe(id);
		try{
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();
			state.recipe.calcTime();
			state.recipe.calcServings();
			clearLoader();
			recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
		} catch(error) {
			console.log(error);
			alert('Something went wrong!');
		}
	}
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

const controlList = () => {
	if(!state.list) state.list = new List();
	state.recipe.ing.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItems(item)
	});
};

const controlLike = () => {
	if(!state.likes) state.likes = new Likes();
	const currID = state.recipe.id;
	if(!state.likes.isLiked(currID)) {
		const newLike = state.likes.addLike(currID, state.recipe.title, state.recipe.author, state.recipe.image);
		likesView.toggleLikeBtn(true);
		likesView.renderLike(newLike);
	} else {
		state.likes.deleteLike(currID);
		likesView.toggleLikeBtn(false);
		likesView.deleteLike(currID);
	}

	likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener('load', () => {
	state.likes = new Likes();
	state.likes.readStorage();
	likesView.toggleLikeMenu(state.likes.getNumLikes());
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

elements.recipe.addEventListener('click', e => {
	if(e.target.matches('.btn-decrease, .btn-decrease *')) {
		if(state.recipe.servings > 1){
			state.recipe.updateServings('dec');
			recipeView.updateServingsIngredients(state.recipe);
		}
	} else if(e.target.matches('.btn-increase, .btn-increase *')) {
		state.recipe.updateServings('inc');
		recipeView.updateServingsIngredients(state.recipe);
	} else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
        controlList();
    } else if (e.target.matches('.recipe__love, .recipe__love *')) {
        controlLike();
    }
});

elements.shopping.addEventListener('click', e => {
	const id = e.target.closest('.shopping__item').dataset.itemid;

	if(e.target.matches('.shopping__delete, .shopping__delete *')) {
		state.list.deleteItem(id);
		listView.deleteItem(id);
	} else if(e.target.matches('.shopping__count-value')) {
		const val = parseFloat(e.target.value, 10);
		state.list.updateCount(id, val);
	}
});

