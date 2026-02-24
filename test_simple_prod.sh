#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

echo "Testing SimpleProduct attributes..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { products(first: 1) { nodes { ... on SimpleProduct { name allPaBtu { nodes { slug } } allPaClasaEnergetica { nodes { slug } } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"
