let products = [];

window.onload = async ()=>{

products = await getProducts();

document
.getElementById("categorySelect")
.addEventListener(
"change",
loadProducts
);

};

function loadProducts(){

const category =
document
.getElementById("categorySelect")
.value;

const employeeBrand =
document
.getElementById("brandSelect")
.value;

let result =
products.filter(
p=>p.category===category
);

result.sort((a,b)=>{

if(a.brand===employeeBrand)
return -1;

if(b.brand===employeeBrand)
return 1;

return 0;

});

renderProducts(result);

}

function renderProducts(items){

const container =
document.getElementById("products");

container.innerHTML="";

items.forEach(item=>{

const card =
document.createElement("div");

card.className="card";

if(
item.brand===
document.getElementById("brandSelect").value
){
card.classList.add("priority");
}

card.innerHTML=`

<h3>
${item.brand}
${item.model}
</h3>

<p>
ราคา:
${item.price}
บาท
</p>

<p>
กำลังไฟ:
${item.watt}W
</p>

<p>
ระบบ:
${item.powerType}
</p>

`;

container.appendChild(card);

});

}