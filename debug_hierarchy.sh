#!/bin/bash

ENDPOINT="https://cms.climaticpro.ro/graphql"

# 1. Fetch hierarchy to find a parent
echo "Fetching Category Hierarchy..."
curl -s -X POST -H "Content-Type: application/json" -d '{
  "query": "query { productCategories(first: 100) { nodes { name slug children { nodes { name slug } } } } }"
}' $ENDPOINT --insecure
echo -e "\n--------------------------------"

# 2. Test querying a known parent (we'll pick one from above output)
# For now, let's assume "aer-conditionat-rezidential" might be a parent of "split-de-perete".
# We will run a conditional test after seeing the output, but let's try a likely candidate.
